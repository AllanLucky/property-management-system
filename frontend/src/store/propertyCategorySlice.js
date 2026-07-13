import {
  createSlice,
  createAsyncThunk,
} from "@reduxjs/toolkit";

import {
  getPropertyCategoriesApi,
  getPropertyCategoryApi,
  createPropertyCategoryApi,
  updatePropertyCategoryApi,
  deletePropertyCategoryApi,
} from "../services/propertyCategory.service";

/*
|--------------------------------------------------------------------------
| INITIAL STATE
|--------------------------------------------------------------------------
*/
const initialState = {
  categories: {
    data: [],
    links: [],
    meta: {},
  },

  category: null,

  loading: false,
  creating: false,
  updating: false,
  deleting: false,

  success: false,

  error: null,
  validationErrors: {},
};

/*
|--------------------------------------------------------------------------
| FETCH ALL
|--------------------------------------------------------------------------
*/
export const fetchPropertyCategories =
  createAsyncThunk(
    "propertyCategories/fetchAll",
    async (
      params = {},
      { rejectWithValue }
    ) => {
      try {
        const response =
          await getPropertyCategoriesApi(
            params
          );

        return response.data;
      } catch (error) {
        return rejectWithValue(
          error.response?.data || {
            message: error.message,
          }
        );
      }
    }
  );

/*
|--------------------------------------------------------------------------
| FETCH ONE
|--------------------------------------------------------------------------
*/
export const fetchPropertyCategory =
  createAsyncThunk(
    "propertyCategories/fetchOne",
    async (
      id,
      { rejectWithValue }
    ) => {
      try {
        const response =
          await getPropertyCategoryApi(id);

        return response.data;
      } catch (error) {
        return rejectWithValue(
          error.response?.data || {
            message: error.message,
          }
        );
      }
    }
  );

/*
|--------------------------------------------------------------------------
| CREATE
|--------------------------------------------------------------------------
*/
export const createPropertyCategory =
  createAsyncThunk(
    "propertyCategories/create",
    async (
      data,
      { rejectWithValue }
    ) => {
      try {
        const response =
          await createPropertyCategoryApi(
            data
          );

        return response.data;
      } catch (error) {
        return rejectWithValue(
          error.response?.data || {
            message: error.message,
          }
        );
      }
    }
  );

/*
|--------------------------------------------------------------------------
| UPDATE
|--------------------------------------------------------------------------
*/
export const updatePropertyCategory =
  createAsyncThunk(
    "propertyCategories/update",
    async (
      { id, data },
      { rejectWithValue }
    ) => {
      try {
        const response =
          await updatePropertyCategoryApi(
            id,
            data
          );

        return response.data;
      } catch (error) {
        return rejectWithValue(
          error.response?.data || {
            message: error.message,
          }
        );
      }
    }
  );

/*
|--------------------------------------------------------------------------
| DELETE
|--------------------------------------------------------------------------
*/
export const deletePropertyCategory =
  createAsyncThunk(
    "propertyCategories/delete",
    async (
      id,
      { rejectWithValue }
    ) => {
      try {
        await deletePropertyCategoryApi(id);

        return id;
      } catch (error) {
        return rejectWithValue(
          error.response?.data || {
            message: error.message,
          }
        );
      }
    }
  );

const propertyCategorySlice =
  createSlice({
    name: "propertyCategories",

    initialState,

    reducers: {
      clearPropertyCategoryError:
        (state) => {
          state.error = null;
          state.validationErrors = {};
        },

      clearPropertyCategorySuccess:
        (state) => {
          state.success = false;
        },

      resetPropertyCategoryState:
        (state) => {
          state.loading = false;
          state.creating = false;
          state.updating = false;
          state.deleting = false;

          state.success = false;

          state.error = null;
          state.validationErrors = {};
        },
    },

    extraReducers: (builder) => {
      builder

        /*
        |--------------------------------------------------------------------------
        | FETCH ALL
        |--------------------------------------------------------------------------
        */
        .addCase(
          fetchPropertyCategories.pending,
          (state) => {
            state.loading = true;
            state.error = null;
          }
        )

        .addCase(
          fetchPropertyCategories.fulfilled,
          (state, action) => {
            state.loading = false;

            state.categories = {
              data:
                action.payload?.data ||
                [],
              links:
                action.payload?.links ||
                [],
              meta:
                action.payload?.meta ||
                {},
            };
          }
        )

        .addCase(
          fetchPropertyCategories.rejected,
          (state, action) => {
            state.loading = false;

            state.error =
              action.payload?.message ||
              "Failed to fetch property categories";
          }
        )

        /*
        |--------------------------------------------------------------------------
        | FETCH ONE
        |--------------------------------------------------------------------------
        */
        .addCase(
          fetchPropertyCategory.fulfilled,
          (state, action) => {
            state.loading = false;

            state.category =
              action.payload?.data ||
              action.payload;
          }
        )

        /*
        |--------------------------------------------------------------------------
        | CREATE
        |--------------------------------------------------------------------------
        */
        .addCase(
          createPropertyCategory.pending,
          (state) => {
            state.creating = true;

            state.error = null;
            state.validationErrors =
              {};

            state.success = false;
          }
        )

        .addCase(
          createPropertyCategory.fulfilled,
          (state, action) => {
            state.creating = false;
            state.success = true;

            const category =
              action.payload?.data ||
              action.payload;

            state.categories.data.unshift(
              category
            );
          }
        )

        .addCase(
          createPropertyCategory.rejected,
          (state, action) => {
            state.creating = false;

            state.error =
              action.payload?.message ||
              "Failed to create property category";

            state.validationErrors =
              action.payload?.errors ||
              {};
          }
        )

        /*
        |--------------------------------------------------------------------------
        | UPDATE
        |--------------------------------------------------------------------------
        */
        .addCase(
          updatePropertyCategory.pending,
          (state) => {
            state.updating = true;

            state.error = null;
            state.validationErrors =
              {};

            state.success = false;
          }
        )

        .addCase(
          updatePropertyCategory.fulfilled,
          (state, action) => {
            state.updating = false;
            state.success = true;

            const updated =
              action.payload?.data ||
              action.payload;

            const index =
              state.categories.data.findIndex(
                (item) =>
                  item.id === updated.id
              );

            if (index !== -1) {
              state.categories.data[
                index
              ] = updated;
            }

            state.category = updated;
          }
        )

        .addCase(
          updatePropertyCategory.rejected,
          (state, action) => {
            state.updating = false;

            state.error =
              action.payload?.message ||
              "Failed to update property category";

            state.validationErrors =
              action.payload?.errors ||
              {};
          }
        )

        /*
        |--------------------------------------------------------------------------
        | DELETE
        |--------------------------------------------------------------------------
        */
        .addCase(
          deletePropertyCategory.pending,
          (state) => {
            state.deleting = true;

            state.error = null;
            state.success = false;
          }
        )

        .addCase(
          deletePropertyCategory.fulfilled,
          (state, action) => {
            state.deleting = false;
            state.success = true;

            state.categories.data =
              state.categories.data.filter(
                (item) =>
                  item.id !==
                  action.payload
              );
          }
        )

        .addCase(
          deletePropertyCategory.rejected,
          (state, action) => {
            state.deleting = false;

            state.error =
              action.payload?.message ||
              "Failed to delete property category";
          }
        );
    },
  });

export const {
  clearPropertyCategoryError,
  clearPropertyCategorySuccess,
  resetPropertyCategoryState,
} = propertyCategorySlice.actions;

export default propertyCategorySlice.reducer;