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
    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [loadingUnit, setLoadingUnit] = useState(false);
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
    | INITIAL PARAMS REF
    |--------------------------------------------------------------------------
    |
    | Prevent unnecessary API calls when an object is recreated by the
    | parent component.
    |
    */

    const initialParamsRef = useRef(initialParams);

    useEffect(() => {
        initialParamsRef.current = initialParams;
    }, [initialParams]);

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE STATUS
    |--------------------------------------------------------------------------
    */

    const normalizeStatus = useCallback((status) => {
        if (!status) {
            return {
                value: "unknown",
                label: "Unknown",
            };
        }

        if (typeof status === "string") {
            return {
                value: status,
                label:
                    status.charAt(0).toUpperCase() +
                    status.slice(1).replace(/_/g, " "),
            };
        }

        if (typeof status === "object") {
            return {
                ...status,
                value:
                    status.value ??
                    status.current ??
                    "unknown",
                label:
                    status.label ??
                    status.name ??
                    status.value ??
                    "Unknown",
            };
        }

        return {
            value: "unknown",
            label: "Unknown",
        };
    }, []);

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE UNIT
    |--------------------------------------------------------------------------
    */

    const normalizeUnit = useCallback(
        (item) => {
            if (!item || typeof item !== "object") {
                return item;
            }

            return {
                ...item,

                status: normalizeStatus(
                    item.status
                ),

                property: item.property
                    ? {
                          ...item.property,
                          name:
                              item.property.name ??
                              item.property.title ??
                              `Property #${item.property.id}`,
                      }
                    : null,

                apartment: item.apartment
                    ? {
                          ...item.apartment,
                          name:
                              item.apartment.name ??
                              `Apartment #${item.apartment.id}`,
                      }
                    : null,

                details: item.details ?? {},

                pricing: item.pricing ?? {},

                features: item.features ?? {},

                tenant: item.tenant ?? null,

                tenancy: item.tenancy ?? null,

                tenancy_statistics:
                    item.tenancy_statistics ?? {
                        total: 0,
                        active: 0,
                        pending: 0,
                        expired: 0,
                        terminated: 0,
                        cancelled: 0,
                    },

                maintenance:
                    item.maintenance ?? {
                        total: 0,
                        open: 0,
                        pending: 0,
                        assigned: 0,
                        in_progress: 0,
                        on_hold: 0,
                        completed: 0,
                        cancelled: 0,
                        rejected: 0,
                        estimated_cost: 0,
                        actual_cost: 0,
                    },

                maintenance_summary:
                    item.maintenance_summary ?? {},

                insights: item.insights ?? {},

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
    */

    const normalizeUnitsResponse = useCallback(
        (response) => {
            /*
            |--------------------------------------------------------------------------
            | Service may return:
            |
            | {
            |     status: true,
            |     code: 200,
            |     message: "...",
            |     data: []
            | }
            |--------------------------------------------------------------------------
            */

            const payload =
                response?.data ??
                response ??
                {};

            /*
            |--------------------------------------------------------------------------
            | Direct array
            |--------------------------------------------------------------------------
            */

            if (Array.isArray(payload)) {
                return {
                    data: payload.map(normalizeUnit),
                    meta: null,
                };
            }

            /*
            |--------------------------------------------------------------------------
            | Standard Laravel response:
            |
            | {
            |     status: true,
            |     data: []
            | }
            |--------------------------------------------------------------------------
            */

            if (
                Array.isArray(
                    payload?.data
                )
            ) {
                /*
                |--------------------------------------------------------------------------
                | Non-paginated response
                |--------------------------------------------------------------------------
                */

                if (
                    !payload.data.current_page &&
                    !payload.data.data
                ) {
                    return {
                        data: payload.data.map(
                            normalizeUnit
                        ),
                        meta: payload,
                    };
                }

                /*
                |--------------------------------------------------------------------------
                | Paginated response
                |
                | data: {
                |     data: [],
                |     current_page: 1,
                |     last_page: 5,
                |     ...
                | }
                |--------------------------------------------------------------------------
                */

                if (
                    Array.isArray(
                        payload.data.data
                    )
                ) {
                    return {
                        data: payload.data.data.map(
                            normalizeUnit
                        ),
                        meta: payload.data,
                    };
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Payload contains units
            |--------------------------------------------------------------------------
            */

            if (
                Array.isArray(
                    payload?.units
                )
            ) {
                return {
                    data: payload.units.map(
                        normalizeUnit
                    ),
                    meta: payload,
                };
            }

            /*
            |--------------------------------------------------------------------------
            | Empty response
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
    | LOAD UNITS
    |--------------------------------------------------------------------------
    */

    const getUnits = useCallback(
        async (params = {}) => {
            setLoading(true);
            setError(null);

            try {
                const response =
                    await fetchUnits({
                        ...initialParamsRef.current,
                        ...params,
                    });

                const normalized =
                    normalizeUnitsResponse(
                        response
                    );

                setUnits(
                    Array.isArray(
                        normalized.data
                    )
                        ? normalized.data
                        : []
                );

                /*
                |--------------------------------------------------------------------------
                | Pagination
                |--------------------------------------------------------------------------
                */

                const meta =
                    normalized.meta;

                const dataLength =
                    normalized.data.length;

                setPagination({
                    current_page:
                        meta?.current_page ??
                        1,

                    last_page:
                        meta?.last_page ??
                        1,

                    per_page:
                        meta?.per_page ??
                        dataLength,

                    total:
                        meta?.total ??
                        dataLength,

                    from:
                        meta?.from ??
                        (dataLength > 0
                            ? 1
                            : 0),

                    to:
                        meta?.to ??
                        dataLength,
                });

                return normalized.data;
            } catch (err) {
                console.error(
                    "FETCH UNITS ERROR:",
                    err
                );

                setError(err);

                /*
                |--------------------------------------------------------------------------
                | IMPORTANT
                |
                | Do not swallow the error. Callers such as UnitList can
                | catch it and display their own notification.
                |--------------------------------------------------------------------------
                */

                throw err;
            } finally {
                setLoading(false);
            }
        },
        [normalizeUnitsResponse]
    );

    /*
    |--------------------------------------------------------------------------
    | GET SINGLE UNIT
    |--------------------------------------------------------------------------
    */

    const getUnit = useCallback(
        async (id) => {
            if (!id) {
                const validationError = {
                    status: 400,
                    message:
                        "Unit ID is required.",
                    errors: null,
                };

                setError(validationError);

                throw validationError;
            }

            setLoadingUnit(true);
            setError(null);

            try {
                const response =
                    await fetchUnit(id);

                const payload =
                    response?.data ??
                    response ??
                    {};

                const result =
                    payload?.unit ??
                    payload?.data ??
                    payload;

                const normalizedUnit =
                    normalizeUnit(result);

                setUnit(
                    normalizedUnit
                );

                return normalizedUnit;
            } catch (err) {
                console.error(
                    "FETCH UNIT ERROR:",
                    err
                );

                setError(err);

                throw err;
            } finally {
                setLoadingUnit(false);
            }
        },
        [normalizeUnit]
    );

    /*
    |--------------------------------------------------------------------------
    | CREATE UNIT
    |--------------------------------------------------------------------------
    */

    const addUnit = useCallback(
        async (data) => {
            setCreating(true);
            setError(null);

            try {
                const response =
                    await createUnit(data);

                const payload =
                    response?.data ??
                    response ??
                    {};

                const createdUnit =
                    payload?.unit ??
                    payload?.data ??
                    payload;

                const normalizedUnit =
                    normalizeUnit(
                        createdUnit
                    );

                if (
                    normalizedUnit?.id
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
                console.error(
                    "CREATE UNIT ERROR:",
                    err
                );

                setError(err);

                throw err;
            } finally {
                setCreating(false);
            }
        },
        [normalizeUnit]
    );

    /*
    |--------------------------------------------------------------------------
    | UPDATE UNIT
    |--------------------------------------------------------------------------
    */

    const editUnit = useCallback(
        async (id, data) => {
            setUpdating(true);
            setError(null);

            try {
                const response =
                    await updateUnit(
                        id,
                        data
                    );

                const payload =
                    response?.data ??
                    response ??
                    {};

                const updatedUnit =
                    payload?.unit ??
                    payload?.data ??
                    payload;

                const normalizedUnit =
                    normalizeUnit(
                        updatedUnit
                    );

                if (
                    normalizedUnit?.id
                ) {
                    setUnits(
                        (current) =>
                            current.map(
                                (item) =>
                                    item.id ===
                                    normalizedUnit.id
                                        ? {
                                              ...item,
                                              ...normalizedUnit,
                                          }
                                        : item
                            )
                    );

                    setUnit(
                        (current) =>
                            current?.id ===
                            normalizedUnit.id
                                ? {
                                      ...current,
                                      ...normalizedUnit,
                                  }
                                : current
                    );
                }

                return normalizedUnit;
            } catch (err) {
                console.error(
                    "UPDATE UNIT ERROR:",
                    err
                );

                setError(err);

                throw err;
            } finally {
                setUpdating(false);
            }
        },
        [normalizeUnit]
    );

    /*
    |--------------------------------------------------------------------------
    | DELETE UNIT
    |--------------------------------------------------------------------------
    */

    const removeUnit = useCallback(
        async (id) => {
            if (!id) {
                const validationError = {
                    status: 400,
                    message:
                        "Unit ID is required.",
                    errors: null,
                };

                setError(
                    validationError
                );

                throw validationError;
            }

            setDeleting(true);
            setError(null);

            try {
                const response =
                    await deleteUnit(id);

                setUnits(
                    (current) =>
                        current.filter(
                            (item) =>
                                item.id !== id
                        )
                );

                setUnit(
                    (current) =>
                        current?.id === id
                            ? null
                            : current
                );

                return response;
            } catch (err) {
                console.error(
                    "DELETE UNIT ERROR:",
                    err
                );

                setError(err);

                throw err;
            } finally {
                setDeleting(false);
            }
        },
        []
    );

    /*
    |--------------------------------------------------------------------------
    | UPDATE STATUS
    |--------------------------------------------------------------------------
    */

    const changeUnitStatus =
        useCallback(
            async (id, status) => {
                setError(null);

                try {
                    const response =
                        await updateUnitStatus(
                            id,
                            status
                        );

                    const payload =
                        response?.data ??
                        response ??
                        {};

                    const updatedUnit =
                        payload?.unit ??
                        payload?.data ??
                        payload;

                    /*
                    |--------------------------------------------------------------------------
                    | If backend returns complete unit
                    |--------------------------------------------------------------------------
                    */

                    if (
                        updatedUnit?.id
                    ) {
                        const normalizedUnit =
                            normalizeUnit(
                                updatedUnit
                            );

                        setUnits(
                            (current) =>
                                current.map(
                                    (item) =>
                                        item.id ===
                                        id
                                            ? {
                                                  ...item,
                                                  ...normalizedUnit,
                                              }
                                            : item
                                )
                        );

                        setUnit(
                            (current) =>
                                current?.id ===
                                id
                                    ? {
                                          ...current,
                                          ...normalizedUnit,
                                      }
                                    : current
                        );

                        return normalizedUnit;
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | If backend only returns status
                    |--------------------------------------------------------------------------
                    */

                    const normalizedStatus =
                        normalizeStatus(
                            status
                        );

                    setUnits(
                        (current) =>
                            current.map(
                                (item) =>
                                    item.id ===
                                    id
                                        ? {
                                              ...item,
                                              status: normalizedStatus,
                                          }
                                        : item
                            )
                    );

                    setUnit(
                        (current) =>
                            current?.id === id
                                ? {
                                      ...current,
                                      status: normalizedStatus,
                                  }
                                : current
                    );

                    return normalizedStatus;
                } catch (err) {
                    console.error(
                        "UPDATE UNIT STATUS ERROR:",
                        err
                    );

                    setError(err);

                    throw err;
                }
            },
            [
                normalizeStatus,
                normalizeUnit,
            ]
        );

    /*
    |--------------------------------------------------------------------------
    | CHECK AVAILABILITY
    |--------------------------------------------------------------------------
    */

    const getUnitAvailability =
        useCallback(
            async (id) => {
                if (!id) {
                    const validationError = {
                        status: 400,
                        message:
                            "Unit ID is required.",
                        errors: null,
                    };

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
                        response?.data ??
                        response
                    );
                } catch (err) {
                    console.error(
                        "CHECK UNIT AVAILABILITY ERROR:",
                        err
                    );

                    setError(err);

                    throw err;
                } finally {
                    setCheckingAvailability(
                        false
                    );
                }
            },
            []
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
    | CLEAR SELECTED UNIT
    |--------------------------------------------------------------------------
    */

    const clearUnit =
        useCallback(() => {
            setUnit(null);
        }, []);

    /*
    |--------------------------------------------------------------------------
    | REFRESH
    |--------------------------------------------------------------------------
    */

    const refreshUnits =
        useCallback(
            async (params = {}) => {
                return getUnits(params);
            },
            [getUnits]
        );

    /*
    |--------------------------------------------------------------------------
    | AUTO FETCH
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (!autoFetch) {
            return;
        }

        let mounted = true;

        const load = async () => {
            try {
                await getUnits(
                    initialParamsRef.current
                );
            } catch (err) {
                /*
                |--------------------------------------------------------------------------
                | Prevent unhandled promise rejection from auto-fetch.
                |
                | The error has already been stored in state by getUnits().
                |--------------------------------------------------------------------------
                */

                if (!mounted) {
                    return;
                }

                console.error(
                    "AUTO FETCH UNITS ERROR:",
                    err
                );
            }
        };

        load();

        return () => {
            mounted = false;
        };
    }, [autoFetch, getUnits]);

    /*
    |--------------------------------------------------------------------------
    | COMPUTED STATS
    |--------------------------------------------------------------------------
    */

    const stats = useMemo(() => {
        return units.reduce(
            (acc, item) => {
                acc.total += 1;

                const status =
                    item?.status?.value ??
                    item?.status?.current ??
                    item?.status ??
                    "unknown";

                const normalizedStatus =
                    String(status)
                        .toLowerCase()
                        .replace(
                            /[\s-]+/g,
                            "_"
                        );

                if (
                    normalizedStatus ===
                    "vacant"
                ) {
                    acc.vacant += 1;
                }

                if (
                    normalizedStatus ===
                    "occupied"
                ) {
                    acc.occupied += 1;
                }

                if (
                    normalizedStatus ===
                    "reserved"
                ) {
                    acc.reserved += 1;
                }

                if (
                    normalizedStatus ===
                    "maintenance"
                ) {
                    acc.maintenance += 1;
                }

                if (
                    normalizedStatus ===
                    "inactive"
                ) {
                    acc.inactive += 1;
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
        | Backward-Compatible Aliases
        |--------------------------------------------------------------------------
        */

        createUnit: addUnit,
        updateUnit: editUnit,
        deleteUnit: removeUnit,
    };
};

export default useUnit;