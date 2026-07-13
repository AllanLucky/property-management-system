import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";

/*
|--------------------------------------------------------------------------
| REDUX ACTIONS (IMPORT FROM SLICE)
|--------------------------------------------------------------------------
*/
import {
  fetchPropertyTypes,
  fetchPropertyType,
  createPropertyType,
  updatePropertyType,
  deletePropertyType,
  togglePropertyTypeStatus,
  togglePropertyTypeFeatured,
  clearPropertyTypeError,
  clearPropertyTypeSuccess,
  resetPropertyTypeState,
} from "../store/propertyTypeSlice";

/*
|--------------------------------------------------------------------------
| CUSTOM HOOK: usePropertyType
|--------------------------------------------------------------------------
*/
const usePropertyType = () => {
  const dispatch = useDispatch();

  /*
  |--------------------------------------------------------------------------
  | SELECTORS
  |--------------------------------------------------------------------------
  */
  const {
    types,
    type,
    loading,
    creating,
    updating,
    deleting,
    error,
    success,
  } = useSelector((state) => state.propertyTypes || {});

  /*
  |--------------------------------------------------------------------------
  | ACTIONS
  |--------------------------------------------------------------------------
  */

  const getAll = useCallback(
    (params = {}) => {
      dispatch(fetchPropertyTypes(params));
    },
    [dispatch]
  );

  const getOne = useCallback(
    (id) => {
      if (!id) return;
      dispatch(fetchPropertyType(id));
    },
    [dispatch]
  );

  const create = useCallback(
    (data) => {
      dispatch(createPropertyType(data));
    },
    [dispatch]
  );

  const update = useCallback(
    (id, data) => {
      if (!id) return;
      dispatch(updatePropertyType({ id, data }));
    },
    [dispatch]
  );

  const remove = useCallback(
    (id) => {
      if (!id) return;
      dispatch(deletePropertyType(id));
    },
    [dispatch]
  );

  const toggleStatus = useCallback(
    (id) => {
      dispatch(togglePropertyTypeStatus(id));
    },
    [dispatch]
  );

  const toggleFeatured = useCallback(
    (id) => {
      dispatch(togglePropertyTypeFeatured(id));
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | UI HELPERS
  |--------------------------------------------------------------------------
  */

  const clearError = useCallback(() => {
    dispatch(clearPropertyTypeError());
  }, [dispatch]);

  const clearSuccess = useCallback(() => {
    dispatch(clearPropertyTypeSuccess());
  }, [dispatch]);

  const reset = useCallback(() => {
    dispatch(resetPropertyTypeState());
  }, [dispatch]);

  /*
  |--------------------------------------------------------------------------
  | RETURN
  |--------------------------------------------------------------------------
  */
  return {
    /*
    | DATA
    */
    types,
    type,

    /*
    | STATE
    */
    loading,
    creating,
    updating,
    deleting,
    error,
    success,

    /*
    | ACTIONS
    */
    getAll,
    getOne,
    create,
    update,
    remove,
    toggleStatus,
    toggleFeatured,

    /*
    | HELPERS
    */
    clearError,
    clearSuccess,
    reset,
  };
};

export default usePropertyType;