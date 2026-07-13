import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

/*
|--------------------------------------------------------------------------
| SERVICES
|--------------------------------------------------------------------------
*/
import {
  getPropertyTypesService,
  getPropertyTypeService,
  createPropertyTypeService,
  updatePropertyTypeService,
  deletePropertyTypeService,
  togglePropertyTypeStatusService,
  togglePropertyTypeFeaturedService,
} from "../services/propertyType.service";

/*
|--------------------------------------------------------------------------
| INITIAL STATE
|--------------------------------------------------------------------------
*/
const initialState = {
  types: {
    data: [],
    meta: {},
    links: {},
  },

  type: null,

  loading: false,
  creating: false,
  updating: false,
  deleting: false,

  error: null,
  success: false,
};

/*
|--------------------------------------------------------------------------
| FETCH ALL
|--------------------------------------------------------------------------
*/
export const fetchPropertyTypes = createAsyncThunk(
  "propertyTypes/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getPropertyTypesService(params);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| FETCH ONE
|--------------------------------------------------------------------------
*/
export const fetchPropertyType = createAsyncThunk(
  "propertyTypes/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      const response = await getPropertyTypeService(id);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| CREATE
|--------------------------------------------------------------------------
*/
export const createPropertyType = createAsyncThunk(
  "propertyTypes/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createPropertyTypeService(data);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| UPDATE
|--------------------------------------------------------------------------
*/
export const updatePropertyType = createAsyncThunk(
  "propertyTypes/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await updatePropertyTypeService(id, data);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| DELETE
|--------------------------------------------------------------------------
*/
export const deletePropertyType = createAsyncThunk(
  "propertyTypes/delete",
  async (id, { rejectWithValue }) => {
    try {
      await deletePropertyTypeService(id);
      return id;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| TOGGLE STATUS
|--------------------------------------------------------------------------
*/
export const togglePropertyTypeStatus = createAsyncThunk(
  "propertyTypes/toggleStatus",
  async (id, { rejectWithValue }) => {
    try {
      const response = await togglePropertyTypeStatusService(id);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| TOGGLE FEATURED
|--------------------------------------------------------------------------
*/
export const togglePropertyTypeFeatured = createAsyncThunk(
  "propertyTypes/toggleFeatured",
  async (id, { rejectWithValue }) => {
    try {
      const response = await togglePropertyTypeFeaturedService(id);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| SLICE
|--------------------------------------------------------------------------
*/
const propertyTypeSlice = createSlice({
  name: "propertyTypes",
  initialState,

  reducers: {
    clearPropertyTypeError: (state) => {
      state.error = null;
    },

    clearPropertyTypeSuccess: (state) => {
      state.success = false;
    },

    resetPropertyTypeState: (state) => {
      state.loading = false;
      state.creating = false;
      state.updating = false;
      state.deleting = false;
      state.error = null;
      state.success = false;
    },
  },

  extraReducers: (builder) => {
    builder

      /*
      |--------------------------------------------------------------------------
      | FETCH ALL
      |--------------------------------------------------------------------------
      */
      .addCase(fetchPropertyTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPropertyTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.types = {
          data: action.payload?.data || [],
          meta: action.payload?.meta || {},
          links: action.payload?.links || {},
        };
      })
      .addCase(fetchPropertyTypes.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch property types";
      })

      /*
      |--------------------------------------------------------------------------
      | FETCH ONE
      |--------------------------------------------------------------------------
      */
      .addCase(fetchPropertyType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPropertyType.fulfilled, (state, action) => {
        state.loading = false;
        state.type = action.payload?.data || action.payload;
      })
      .addCase(fetchPropertyType.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch property type";
      })

      /*
      |--------------------------------------------------------------------------
      | CREATE
      |--------------------------------------------------------------------------
      */
      .addCase(createPropertyType.pending, (state) => {
        state.creating = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createPropertyType.fulfilled, (state, action) => {
        state.creating = false;
        state.success = true;

        const newType = action.payload?.data || action.payload;

        state.types.data.unshift(newType);
      })
      .addCase(createPropertyType.rejected, (state, action) => {
        state.creating = false;
        state.error =
          action.payload?.message || "Failed to create property type";
      })

      /*
      |--------------------------------------------------------------------------
      | UPDATE
      |--------------------------------------------------------------------------
      */
      .addCase(updatePropertyType.pending, (state) => {
        state.updating = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updatePropertyType.fulfilled, (state, action) => {
        state.updating = false;
        state.success = true;

        const updated = action.payload?.data || action.payload;

        const index = state.types.data.findIndex(
          (item) => item.id === updated.id
        );

        if (index !== -1) {
          state.types.data[index] = updated;
        }

        state.type = updated;
      })
      .addCase(updatePropertyType.rejected, (state, action) => {
        state.updating = false;
        state.error =
          action.payload?.message || "Failed to update property type";
      })

      /*
      |--------------------------------------------------------------------------
      | DELETE
      |--------------------------------------------------------------------------
      */
      .addCase(deletePropertyType.pending, (state) => {
        state.deleting = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deletePropertyType.fulfilled, (state, action) => {
        state.deleting = false;
        state.success = true;

        state.types.data = state.types.data.filter(
          (item) => item.id !== action.payload
        );
      })
      .addCase(deletePropertyType.rejected, (state, action) => {
        state.deleting = false;
        state.error =
          action.payload?.message || "Failed to delete property type";
      })

      /*
      |--------------------------------------------------------------------------
      | TOGGLE STATUS
      |--------------------------------------------------------------------------
      */
      .addCase(togglePropertyTypeStatus.fulfilled, (state, action) => {
        const updated = action.payload?.data || action.payload;

        const index = state.types.data.findIndex(
          (item) => item.id === updated.id
        );

        if (index !== -1) {
          state.types.data[index] = updated;
        }
      })

      /*
      |--------------------------------------------------------------------------
      | TOGGLE FEATURED
      |--------------------------------------------------------------------------
      */
      .addCase(togglePropertyTypeFeatured.fulfilled, (state, action) => {
        const updated = action.payload?.data || action.payload;

        const index = state.types.data.findIndex(
          (item) => item.id === updated.id
        );

        if (index !== -1) {
          state.types.data[index] = updated;
        }
      });
  },
});

/*
|--------------------------------------------------------------------------
| ACTIONS EXPORT
|--------------------------------------------------------------------------
*/
export const {
  clearPropertyTypeError,
  clearPropertyTypeSuccess,
  resetPropertyTypeState,
} = propertyTypeSlice.actions;

/*
|--------------------------------------------------------------------------
| REDUCER EXPORT
|--------------------------------------------------------------------------
*/
export default propertyTypeSlice.reducer;