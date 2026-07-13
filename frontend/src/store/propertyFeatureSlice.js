import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

/*
|--------------------------------------------------------------------------
| API
|--------------------------------------------------------------------------
*/
import {
  fetchPropertyFeatures,
  fetchPropertyFeature,
  fetchPropertyFeatureBySlug,
  fetchPropertyFeaturesByProperty,
  fetchHighlightedPropertyFeatures,
  searchPropertyFeatures,
  createPropertyFeature as createFeatureApi,
  updatePropertyFeature as updateFeatureApi,
  deletePropertyFeature as deleteFeatureApi,
  togglePropertyFeatureStatus as toggleStatusApi,
  togglePropertyFeatureHighlight as toggleHighlightApi,
} from "../../src/api/propertyFeature.api";

/*
|--------------------------------------------------------------------------
| INITIAL STATE
|--------------------------------------------------------------------------
*/
const initialState = {
  features: [],
  feature: null,
  highlighted: [],
  loading: false,
  error: null,
};

/*
|--------------------------------------------------------------------------
| THUNKS
|--------------------------------------------------------------------------
*/

// GET ALL
export const fetchPropertyFeaturesList = createAsyncThunk(
  "propertyFeature/getAll",
  async (params, { rejectWithValue }) => {
    try {
      const res = await fetchPropertyFeatures(params);
      return res;
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to fetch features");
    }
  }
);

// GET ONE
export const fetchPropertyFeatureById = createAsyncThunk(
  "propertyFeature/getOne",
  async (id, { rejectWithValue }) => {
    try {
      return await fetchPropertyFeature(id);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to fetch feature");
    }
  }
);

// GET BY SLUG
export const fetchFeatureBySlug = createAsyncThunk(
  "propertyFeature/getBySlug",
  async (slug, { rejectWithValue }) => {
    try {
      return await fetchPropertyFeatureBySlug(slug);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to fetch feature");
    }
  }
);

// BY PROPERTY
export const fetchFeaturesByProperty = createAsyncThunk(
  "propertyFeature/byProperty",
  async ({ propertyId, params }, { rejectWithValue }) => {
    try {
      return await fetchPropertyFeaturesByProperty(propertyId, params);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to fetch property features");
    }
  }
);

// HIGHLIGHTED
export const fetchHighlightedFeatures = createAsyncThunk(
  "propertyFeature/highlighted",
  async (params, { rejectWithValue }) => {
    try {
      return await fetchHighlightedPropertyFeatures(params);
    } catch (error) {
      return rejectWithValue(error?.message || "Failed to fetch highlighted features");
    }
  }
);

// SEARCH
export const searchFeatures = createAsyncThunk(
  "propertyFeature/search",
  async ({ search, params }, { rejectWithValue }) => {
    try {
      return await searchPropertyFeatures(search, params);
    } catch (error) {
      return rejectWithValue(error?.message || "Search failed");
    }
  }
);

// CREATE
export const createPropertyFeature = createAsyncThunk(
  "propertyFeature/create",
  async (data, { rejectWithValue }) => {
    try {
      return await createFeatureApi(data);
    } catch (error) {
      return rejectWithValue(error?.message || "Create failed");
    }
  }
);

// UPDATE
export const updatePropertyFeature = createAsyncThunk(
  "propertyFeature/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await updateFeatureApi(id, data);
    } catch (error) {
      return rejectWithValue(error?.message || "Update failed");
    }
  }
);

// DELETE
export const deletePropertyFeature = createAsyncThunk(
  "propertyFeature/delete",
  async (id, { rejectWithValue }) => {
    try {
      await deleteFeatureApi(id);
      return id;
    } catch (error) {
      return rejectWithValue(error?.message || "Delete failed");
    }
  }
);

// TOGGLE STATUS
export const toggleFeatureStatus = createAsyncThunk(
  "propertyFeature/toggleStatus",
  async (id, { rejectWithValue }) => {
    try {
      return await toggleStatusApi(id);
    } catch (error) {
      return rejectWithValue(error?.message || "Toggle failed");
    }
  }
);

// TOGGLE HIGHLIGHT
export const toggleFeatureHighlight = createAsyncThunk(
  "propertyFeature/toggleHighlight",
  async (id, { rejectWithValue }) => {
    try {
      return await toggleHighlightApi(id);
    } catch (error) {
      return rejectWithValue(error?.message || "Toggle failed");
    }
  }
);

/*
|--------------------------------------------------------------------------
| SLICE
|--------------------------------------------------------------------------
*/
const propertyFeatureSlice = createSlice({
  name: "propertyFeature",
  initialState,
  reducers: {
    clearFeatureState: (state) => {
      state.feature = null;
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /*
      |-------------------------
      | LOADING STATES
      |-------------------------
      */
      .addCase(fetchPropertyFeaturesList.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPropertyFeaturesList.fulfilled, (state, action) => {
        state.loading = false;
        state.features = action.payload?.data?.data || [];
      })
      .addCase(fetchPropertyFeaturesList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /*
      |-------------------------
      | GET ONE
      |-------------------------
      */
      .addCase(fetchPropertyFeatureById.fulfilled, (state, action) => {
        state.feature = action.payload?.data?.data || null;
      })

      /*
      |-------------------------
      | HIGHLIGHTED
      |-------------------------
      */
      .addCase(fetchHighlightedFeatures.fulfilled, (state, action) => {
        state.highlighted = action.payload?.data?.data || [];
      })

      /*
      |-------------------------
      | CREATE
      |-------------------------
      */
      .addCase(createPropertyFeature.fulfilled, (state, action) => {
        const created = action.payload?.data?.data;
        if (created) state.features.unshift(created);
      })

      /*
      |-------------------------
      | UPDATE
      |-------------------------
      */
      .addCase(updatePropertyFeature.fulfilled, (state, action) => {
        const updated = action.payload?.data?.data;

        if (!updated) return;

        state.features = state.features.map((f) =>
          f.id === updated.id ? updated : f
        );

        if (state.feature?.id === updated.id) {
          state.feature = updated;
        }
      })

      /*
      |-------------------------
      | DELETE
      |-------------------------
      */
      .addCase(deletePropertyFeature.fulfilled, (state, action) => {
        state.features = state.features.filter(
          (f) => f.id !== action.payload
        );
      })

      /*
      |-------------------------
      | GLOBAL ERROR
      |-------------------------
      */
      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action) => {
          state.error = action.payload;
        }
      );
  },
});

export const { clearFeatureState } = propertyFeatureSlice.actions;
export default propertyFeatureSlice.reducer;