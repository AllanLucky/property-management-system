import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchPropertyVisits,
  fetchPropertyVisit,
  createPropertyVisit,
  updatePropertyVisit,
  deletePropertyVisit,
  clearCurrentPropertyVisit,
  clearPropertyVisitError,
} from "../store/propertyVisitSlice";

const usePropertyVisit = () => {
  const dispatch = useDispatch();

  const {
    visits,
    visit,
    pagination,
    loading,
    submitting,
    deleting,
    error,
  } = useSelector((state) => state.propertyVisit);

  const getPropertyVisits = useCallback(
    (params = {}) => dispatch(fetchPropertyVisits(params)),
    [dispatch]
  );

  const getPropertyVisit = useCallback(
    (id) => dispatch(fetchPropertyVisit(id)),
    [dispatch]
  );

  const addPropertyVisit = useCallback(
    (payload) => dispatch(createPropertyVisit(payload)),
    [dispatch]
  );

  const editPropertyVisit = useCallback(
    ({ id, data }) => dispatch(updatePropertyVisit({ id, data })),
    [dispatch]
  );

  const removePropertyVisit = useCallback(
    (id) => dispatch(deletePropertyVisit(id)),
    [dispatch]
  );

  const resetCurrentPropertyVisit = useCallback(
    () => dispatch(clearCurrentPropertyVisit()),
    [dispatch]
  );

  const resetError = useCallback(
    () => dispatch(clearPropertyVisitError()),
    [dispatch]
  );

  return {
    // State
    visits,
    visit,
    pagination,
    loading,
    submitting,
    deleting,
    error,

    // Actions
    getPropertyVisits,
    getPropertyVisit,
    addPropertyVisit,
    editPropertyVisit,
    removePropertyVisit,
    resetCurrentPropertyVisit,
    resetError,
  };
};

export default usePropertyVisit;