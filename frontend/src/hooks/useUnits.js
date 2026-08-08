import {
    useCallback,
    useEffect,
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
    | NORMALIZE API RESPONSE
    |--------------------------------------------------------------------------
    */

    const normalizeUnitsResponse = useCallback(
        (response) => {
            /*
            |--------------------------------------------------------------------------
            | Laravel pagination:
            |
            | {
            |     status: true,
            |     data: {
            |         data: [],
            |         current_page: 1,
            |         ...
            |     }
            | }
            |--------------------------------------------------------------------------
            */

            const payload = response?.data ?? response;

            if (Array.isArray(payload)) {
                return {
                    data: payload,
                    meta: null,
                };
            }

            if (Array.isArray(payload?.data)) {
                return {
                    data: payload.data,
                    meta: payload,
                };
            }

            /*
            |--------------------------------------------------------------------------
            | Non-paginated:
            |
            | {
            |     data: []
            | }
            |--------------------------------------------------------------------------
            */

            if (Array.isArray(payload?.units)) {
                return {
                    data: payload.units,
                    meta: payload,
                };
            }

            return {
                data: [],
                meta: payload,
            };
        },
        []
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
                const response = await fetchUnits({
                    ...initialParams,
                    ...params,
                });

                const normalized =
                    normalizeUnitsResponse(response);

                setUnits(normalized.data);

                /*
                |--------------------------------------------------------------------------
                | Pagination
                |--------------------------------------------------------------------------
                */

                if (normalized.meta) {
                    setPagination({
                        current_page:
                            normalized.meta.current_page ??
                            1,

                        last_page:
                            normalized.meta.last_page ??
                            1,

                        per_page:
                            normalized.meta.per_page ??
                            normalized.data.length,

                        total:
                            normalized.meta.total ??
                            normalized.data.length,

                        from:
                            normalized.meta.from ??
                            (normalized.data.length
                                ? 1
                                : 0),

                        to:
                            normalized.meta.to ??
                            normalized.data.length,
                    });
                }

                return normalized.data;
            } catch (err) {
                setError(err);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [
            initialParams,
            normalizeUnitsResponse,
        ]
    );

    /*
    |--------------------------------------------------------------------------
    | GET SINGLE UNIT
    |--------------------------------------------------------------------------
    */

    const getUnit = useCallback(
        async (id) => {
            setLoadingUnit(true);
            setError(null);

            try {
                const response =
                    await fetchUnit(id);

                const payload =
                    response?.data ?? response;

                const result =
                    payload?.unit ??
                    payload;

                setUnit(result);

                return result;
            } catch (err) {
                setError(err);
                throw err;
            } finally {
                setLoadingUnit(false);
            }
        },
        []
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
                    response?.data ?? response;

                const createdUnit =
                    payload?.unit ??
                    payload;

                /*
                |--------------------------------------------------------------------------
                | Add new unit to current list
                |--------------------------------------------------------------------------
                */

                if (createdUnit?.id) {
                    setUnits((current) => [
                        createdUnit,
                        ...current,
                    ]);
                }

                return createdUnit;
            } catch (err) {
                setError(err);
                throw err;
            } finally {
                setCreating(false);
            }
        },
        []
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
                    response?.data ?? response;

                const updatedUnit =
                    payload?.unit ??
                    payload;

                /*
                |--------------------------------------------------------------------------
                | Update current list
                |--------------------------------------------------------------------------
                */

                if (updatedUnit?.id) {
                    setUnits((current) =>
                        current.map((item) =>
                            item.id === updatedUnit.id
                                ? {
                                      ...item,
                                      ...updatedUnit,
                                  }
                                : item
                        )
                    );

                    /*
                    |--------------------------------------------------------------------------
                    | Update selected unit
                    |--------------------------------------------------------------------------
                    */

                    setUnit((current) =>
                        current?.id === updatedUnit.id
                            ? {
                                  ...current,
                                  ...updatedUnit,
                              }
                            : current
                    );
                }

                return updatedUnit;
            } catch (err) {
                setError(err);
                throw err;
            } finally {
                setUpdating(false);
            }
        },
        []
    );

    /*
    |--------------------------------------------------------------------------
    | DELETE UNIT
    |--------------------------------------------------------------------------
    */

    const removeUnit = useCallback(
        async (id) => {
            setDeleting(true);
            setError(null);

            try {
                const response =
                    await deleteUnit(id);

                /*
                |--------------------------------------------------------------------------
                | Remove from current list
                |--------------------------------------------------------------------------
                */

                setUnits((current) =>
                    current.filter(
                        (item) =>
                            item.id !== id
                    )
                );

                /*
                |--------------------------------------------------------------------------
                | Clear selected unit
                |--------------------------------------------------------------------------
                */

                setUnit((current) =>
                    current?.id === id
                        ? null
                        : current
                );

                return response;
            } catch (err) {
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
                        response;

                    const updatedUnit =
                        payload?.unit ??
                        payload;

                    /*
                    |--------------------------------------------------------------------------
                    | Update local list
                    |--------------------------------------------------------------------------
                    */

                    setUnits((current) =>
                        current.map((item) =>
                            item.id === id
                                ? {
                                      ...item,
                                      ...(updatedUnit?.id
                                          ? updatedUnit
                                          : {
                                                status,
                                            }),
                                  }
                                : item
                        )
                    );

                    /*
                    |--------------------------------------------------------------------------
                    | Update selected unit
                    |--------------------------------------------------------------------------
                    */

                    setUnit((current) =>
                        current?.id === id
                            ? {
                                  ...current,
                                  ...(updatedUnit?.id
                                      ? updatedUnit
                                      : {
                                            status,
                                        }),
                              }
                            : current
                    );

                    return updatedUnit;
                } catch (err) {
                    setError(err);
                    throw err;
                }
            },
            []
        );

    /*
    |--------------------------------------------------------------------------
    | CHECK AVAILABILITY
    |--------------------------------------------------------------------------
    */

    const getUnitAvailability =
        useCallback(async (id) => {
            setCheckingAvailability(true);
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
                setError(err);
                throw err;
            } finally {
                setCheckingAvailability(
                    false
                );
            }
        }, []);

    /*
    |--------------------------------------------------------------------------
    | CLEAR ERROR
    |--------------------------------------------------------------------------
    */

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    /*
    |--------------------------------------------------------------------------
    | CLEAR SELECTED UNIT
    |--------------------------------------------------------------------------
    */

    const clearUnit = useCallback(() => {
        setUnit(null);
    }, []);

    /*
    |--------------------------------------------------------------------------
    | REFRESH
    |--------------------------------------------------------------------------
    */

    const refreshUnits = useCallback(
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

        getUnits(initialParams);
    }, [
        autoFetch,
        getUnits,
        initialParams,
    ]);

    /*
    |--------------------------------------------------------------------------
    | RETURN
    |--------------------------------------------------------------------------
    */

    return {
        /*
        | Data
        */
        units,
        unit,

        /*
        | Loading
        */
        loading,
        loadingUnit,
        creating,
        updating,
        deleting,
        checkingAvailability,

        /*
        | Error
        */
        error,

        /*
        | Pagination
        */
        pagination,

        /*
        | CRUD
        */
        getUnits,
        getUnit,
        addUnit,
        editUnit,
        removeUnit,

        /*
        | Status
        */
        changeUnitStatus,

        /*
        | Availability
        */
        getUnitAvailability,

        /*
        | Utilities
        */
        refreshUnits,
        clearError,
        clearUnit,

        /*
        | Backward-compatible aliases
        */
        createUnit: addUnit,
        updateUnit: editUnit,
        deleteUnit: removeUnit,
    };
};

export default useUnit;