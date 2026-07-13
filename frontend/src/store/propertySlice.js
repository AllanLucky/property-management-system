import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import {
  fetchProperties,
  fetchProperty,
  createProperty,
  updateProperty,
  deleteProperty,
} from "../../src/api/property.api";

/*
|--------------------------------------------------------------------------
| INITIAL STATE
|--------------------------------------------------------------------------
*/
const initialState = {
  properties: [],
  property: null,

  loading: false,
  actionLoading: false,

  error: null,
  successMessage: null,
};

/*
|--------------------------------------------------------------------------
| SAFE EXTRACTOR (FINAL LAYER ONLY)
|--------------------------------------------------------------------------
| Service already normalizes response,
| so we just pass data through safely.
*/
const safe = (payload) => payload ?? null;

/*
|--------------------------------------------------------------------------
| GET ALL PROPERTIES
|--------------------------------------------------------------------------
*/
export const getProperties = createAsyncThunk(
  "property/getProperties",
  async (_, thunkAPI) => {
    try {
      return await fetchProperties();
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.message || "Failed to fetch properties"
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| GET SINGLE PROPERTY
|--------------------------------------------------------------------------
*/
export const getProperty = createAsyncThunk(
  "property/getProperty",
  async (id, thunkAPI) => {
    try {
      return await fetchProperty(id);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.message || "Failed to fetch property"
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| CREATE PROPERTY
|--------------------------------------------------------------------------
*/
export const storeProperty = createAsyncThunk(
  "property/storeProperty",
  async (data, thunkAPI) => {
    try {
      return await createProperty(data);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.message || "Failed to create property"
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| UPDATE PROPERTY
|--------------------------------------------------------------------------
*/
export const editProperty = createAsyncThunk(
  "property/editProperty",
  async ({ id, data }, thunkAPI) => {
    try {
      return await updateProperty(id, data);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.message || "Failed to update property"
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| DELETE PROPERTY
|--------------------------------------------------------------------------
*/
export const removeProperty = createAsyncThunk(
  "property/removeProperty",
  async (id, thunkAPI) => {
    try {
      await deleteProperty(id);
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.message || "Failed to delete property"
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| SLICE
|--------------------------------------------------------------------------
*/
const propertySlice = createSlice({
  name: "property",
  initialState,

  reducers: {
    clearPropertyMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },

    clearCurrentProperty: (state) => {
      state.property = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /*
      |---------------- GET ALL ----------------
      */
      .addCase(getProperties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProperties.fulfilled, (state, action) => {
        state.loading = false;
        state.properties = safe(action.payload) || [];
      })
      .addCase(getProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /*
      |---------------- GET SINGLE ----------------
      */
      .addCase(getProperty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProperty.fulfilled, (state, action) => {
        state.loading = false;
        state.property = safe(action.payload);
      })
      .addCase(getProperty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /*
      |---------------- CREATE ----------------
      */
      .addCase(storeProperty.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(storeProperty.fulfilled, (state, action) => {
        state.actionLoading = false;

        const newProperty = safe(action.payload);

        if (newProperty) {
          state.properties.unshift(newProperty);
        }

        state.successMessage =
          action.payload?.message || "Property created successfully";
      })
      .addCase(storeProperty.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      /*
      |---------------- UPDATE ----------------
      */
      .addCase(editProperty.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(editProperty.fulfilled, (state, action) => {
        state.actionLoading = false;

        const updated = safe(action.payload);

        if (updated?.id) {
          state.properties = state.properties.map((p) =>
            p.id === updated.id ? updated : p
          );

          state.property = updated;
        }

        state.successMessage =
          action.payload?.message || "Property updated successfully";
      })
      .addCase(editProperty.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      /*
      |---------------- DELETE ----------------
      */
      .addCase(removeProperty.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(removeProperty.fulfilled, (state, action) => {
        state.actionLoading = false;

        state.properties = state.properties.filter(
          (p) => p.id !== action.payload
        );

        state.successMessage = "Property deleted successfully";
      })
      .addCase(removeProperty.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearPropertyMessages,
  clearCurrentProperty,
} = propertySlice.actions;

export default propertySlice.reducer;