import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import propertyFavoriteService from "../services/propertyFavorite.service";

/*
|--------------------------------------------------------------------------
| Initial State
|--------------------------------------------------------------------------
*/

const initialState = {
  favorites: [],
  myFavorites: [],
  favorite: null,

  status: {},

  meta: null,
  links: null,

  loading: false,
  submitting: false,
  deleting: false,

  error: null,
  success: null,

  filters: {
    search: "",
    user_id: "",
    property_id: "",
    is_active: "",
    page: 1,
    per_page: 15,
  },
};

/*
|--------------------------------------------------------------------------
| GET ALL
|--------------------------------------------------------------------------
*/

export const fetchPropertyFavorites = createAsyncThunk(
  "propertyFavorites/fetchAll",
  async (params = {}, thunkAPI) => {
    try {
      return await propertyFavoriteService.getAll(params);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || error.message
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| MY FAVORITES
|--------------------------------------------------------------------------
*/

export const fetchMyFavorites = createAsyncThunk(
  "propertyFavorites/fetchMyFavorites",
  async (params = {}, thunkAPI) => {
    try {
      return await propertyFavoriteService.myFavorites(params);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || error.message
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| SHOW
|--------------------------------------------------------------------------
*/

export const fetchPropertyFavorite = createAsyncThunk(
  "propertyFavorites/show",
  async (id, thunkAPI) => {
    try {
      return await propertyFavoriteService.getById(id);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || error.message
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| STORE
|--------------------------------------------------------------------------
*/

export const createPropertyFavorite = createAsyncThunk(
  "propertyFavorites/create",
  async (data, thunkAPI) => {
    try {
      return await propertyFavoriteService.create(data);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || error.message
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| UPDATE
|--------------------------------------------------------------------------
*/

export const updatePropertyFavorite = createAsyncThunk(
  "propertyFavorites/update",
  async ({ id, data }, thunkAPI) => {
    try {
      return await propertyFavoriteService.update(id, data);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || error.message
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| DELETE
|--------------------------------------------------------------------------
*/

export const deletePropertyFavorite = createAsyncThunk(
  "propertyFavorites/delete",
  async (id, thunkAPI) => {
    try {
      await propertyFavoriteService.remove(id);
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || error.message
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| TOGGLE
|--------------------------------------------------------------------------
*/

export const togglePropertyFavorite = createAsyncThunk(
  "propertyFavorites/toggle",
  async (propertyId, thunkAPI) => {
    try {
      return await propertyFavoriteService.toggle(propertyId);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || error.message
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| STATUS
|--------------------------------------------------------------------------
*/

export const checkFavoriteStatus = createAsyncThunk(
  "propertyFavorites/status",
  async (propertyId, thunkAPI) => {
    try {
      const response =
        await propertyFavoriteService.status(propertyId);

      return {
        propertyId,
        ...response,
      };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || error.message
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| Slice
|--------------------------------------------------------------------------
*/

const propertyFavoriteSlice = createSlice({
  name: "propertyFavorites",

  initialState,

  reducers: {
    clearFavorite(state) {
      state.favorite = null;
    },

    clearErrors(state) {
      state.error = null;
    },

    clearSuccess(state) {
      state.success = null;
    },

    setFilters(state, action) {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
    },

    resetFilters(state) {
      state.filters = initialState.filters;
    },
  },

  extraReducers: (builder) => {
    builder

      /*
      |--------------------------------------------------------------------------
      | FETCH ALL
      |--------------------------------------------------------------------------
      */

      .addCase(fetchPropertyFavorites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchPropertyFavorites.fulfilled, (state, action) => {
        state.loading = false;

        state.favorites = action.payload.data ?? [];

        state.meta = action.payload.meta ?? null;

        state.links = action.payload.links ?? null;
      })

      .addCase(fetchPropertyFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | MY FAVORITES
      |--------------------------------------------------------------------------
      */

      .addCase(fetchMyFavorites.pending, (state) => {
        state.loading = true;
      })

      .addCase(fetchMyFavorites.fulfilled, (state, action) => {
        state.loading = false;

        state.myFavorites = action.payload.data ?? [];

        state.meta = action.payload.meta ?? null;

        state.links = action.payload.links ?? null;
      })

      .addCase(fetchMyFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | SHOW
      |--------------------------------------------------------------------------
      */

      .addCase(fetchPropertyFavorite.pending, (state) => {
        state.loading = true;
      })

      .addCase(fetchPropertyFavorite.fulfilled, (state, action) => {
        state.loading = false;
        state.favorite = action.payload.data;
      })

      .addCase(fetchPropertyFavorite.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | CREATE
      |--------------------------------------------------------------------------
      */

      .addCase(createPropertyFavorite.pending, (state) => {
        state.submitting = true;
      })

      .addCase(createPropertyFavorite.fulfilled, (state, action) => {
        state.submitting = false;

        if (action.payload.data) {
          state.favorites.unshift(action.payload.data);
        }

        state.success = action.payload.message;
      })

      .addCase(createPropertyFavorite.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | UPDATE
      |--------------------------------------------------------------------------
      */

      .addCase(updatePropertyFavorite.pending, (state) => {
        state.submitting = true;
      })

      .addCase(updatePropertyFavorite.fulfilled, (state, action) => {
        state.submitting = false;

        const updated = action.payload.data;

        state.favorite = updated;

        state.favorites = state.favorites.map((item) =>
          item.id === updated.id ? updated : item
        );

        state.myFavorites = state.myFavorites.map((item) =>
          item.id === updated.id ? updated : item
        );

        state.success = action.payload.message;
      })

      .addCase(updatePropertyFavorite.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | DELETE
      |--------------------------------------------------------------------------
      */

      .addCase(deletePropertyFavorite.pending, (state) => {
        state.deleting = true;
      })

      .addCase(deletePropertyFavorite.fulfilled, (state, action) => {
        state.deleting = false;

        state.favorites = state.favorites.filter(
          (item) => item.id !== action.payload
        );

        state.myFavorites = state.myFavorites.filter(
          (item) => item.id !== action.payload
        );
      })

      .addCase(deletePropertyFavorite.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | TOGGLE
      |--------------------------------------------------------------------------
      */

      .addCase(togglePropertyFavorite.pending, (state) => {
        state.submitting = true;
      })

      .addCase(togglePropertyFavorite.fulfilled, (state, action) => {
        state.submitting = false;

        const favorite = action.payload.data;

        if (favorite?.property?.id) {
          state.status[favorite.property.id] = true;
        }

        state.success = action.payload.message;
      })

      .addCase(togglePropertyFavorite.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | STATUS
      |--------------------------------------------------------------------------
      */

      .addCase(checkFavoriteStatus.fulfilled, (state, action) => {
        state.status[action.payload.propertyId] =
          action.payload.data?.is_favorite ??
          action.payload.is_favorite ??
          false;
      })

      .addCase(checkFavoriteStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.payload ||
          "Failed to check favorite status";
      });
  },
});

/*
|--------------------------------------------------------------------------
| Actions
|--------------------------------------------------------------------------
*/

export const {
  clearFavorite,
  clearErrors,
  clearSuccess,
  setFilters,
  resetFilters,
} = propertyFavoriteSlice.actions;

/*
|--------------------------------------------------------------------------
| Selectors
|--------------------------------------------------------------------------
*/

export const selectPropertyFavorites = (state) =>
  state.propertyFavorites.favorites;

export const selectMyFavorites = (state) =>
  state.propertyFavorites.myFavorites;

export const selectPropertyFavorite = (state) =>
  state.propertyFavorites.favorite;

export const selectFavoriteStatus = (propertyId) => (state) =>
  state.propertyFavorites.status[propertyId] ?? false;

export const selectFavoriteMeta = (state) =>
  state.propertyFavorites.meta;

export const selectFavoriteLinks = (state) =>
  state.propertyFavorites.links;

export const selectFavoriteLoading = (state) =>
  state.propertyFavorites.loading;

export const selectFavoriteSubmitting = (state) =>
  state.propertyFavorites.submitting;

export const selectFavoriteDeleting = (state) =>
  state.propertyFavorites.deleting;

export const selectFavoriteError = (state) =>
  state.propertyFavorites.error;

export const selectFavoriteSuccess = (state) =>
  state.propertyFavorites.success;

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

export default propertyFavoriteSlice.reducer;