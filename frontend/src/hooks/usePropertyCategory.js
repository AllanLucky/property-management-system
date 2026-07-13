import { useDispatch, useSelector } from "react-redux";
import {
  getPropertyCategoriesThunk,
  getPropertyCategoryThunk,
  createPropertyCategoryThunk,
  updatePropertyCategoryThunk,
  deletePropertyCategoryThunk,
} from "../store/propertyCategorySlice";

export const usePropertyCategory = () => {
  const dispatch = useDispatch();

  const { categories, category, loading, error } = useSelector(
    (state) => state.propertyCategories
  );

  return {
    categories,
    category,
    loading,
    error,

    fetchAll: () => dispatch(getPropertyCategoriesThunk()),
    fetchOne: (id) => dispatch(getPropertyCategoryThunk(id)),
    create: (data) => dispatch(createPropertyCategoryThunk(data)),
    update: (id, data) =>
      dispatch(updatePropertyCategoryThunk({ id, data })),
    remove: (id) => dispatch(deletePropertyCategoryThunk(id)),
  };
};