import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import PropertyAmenityService from "../services/propertyAmenity.service";

/*
|--------------------------------------------------------------------------
| INITIAL STATE
|--------------------------------------------------------------------------
*/
const initialState = {
  amenities: [],
  loading: false,
  error: null,
  currentPropertyId: null,
};

/*
|--------------------------------------------------------------------------
| FETCH PROPERTY AMENITIES
|--------------------------------------------------------------------------
*/
export const fetchPropertyAmenities = createAsyncThunk(
  "propertyAmenities/fetch",
  async (propertyId, thunkAPI) => {
    try {
      if (!propertyId) {
        return thunkAPI.rejectWithValue("Property ID is required");
      }

      const response = await PropertyAmenityService.fetch(propertyId);

      return Array.isArray(response) ? response : [];
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
        "Failed to fetch property amenities"
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| ATTACH AMENITY
|--------------------------------------------------------------------------
*/
export const attachPropertyAmenity = createAsyncThunk(
  "propertyAmenities/attach",
  async ({ propertyId, amenityId, data }, thunkAPI) => {
    try {
      return await PropertyAmenityService.attach(
        propertyId,
        amenityId,
        data
      );
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
        "Failed to attach amenity"
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| UPDATE AMENITY
|--------------------------------------------------------------------------
*/
export const updatePropertyAmenity = createAsyncThunk(
  "propertyAmenities/update",
  async ({ propertyId, amenityId, data }, thunkAPI) => {
    try {
      return await PropertyAmenityService.update(
        propertyId,
        amenityId,
        data
      );
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
        "Failed to update amenity"
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| DELETE AMENITY
|--------------------------------------------------------------------------
*/
export const deletePropertyAmenity = createAsyncThunk(
  "propertyAmenities/delete",
  async ({ propertyId, amenityId }, thunkAPI) => {
    try {
      await PropertyAmenityService.remove(propertyId, amenityId);

      return amenityId;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
        "Failed to remove amenity"
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| SYNC AMENITIES
|--------------------------------------------------------------------------
*/
export const syncPropertyAmenities = createAsyncThunk(
  "propertyAmenities/sync",
  async ({ propertyId, amenities }, thunkAPI) => {
    try {
      const response = await PropertyAmenityService.sync(
        propertyId,
        amenities
      );

      return Array.isArray(response) ? response : [];
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
        "Failed to sync amenities"
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| SLICE
|--------------------------------------------------------------------------
*/
const propertyAmenitySlice = createSlice({
  name: "propertyAmenities",
  initialState,

  reducers: {
    clearAmenitiesState: (state) => {
      state.amenities = [];
      state.loading = false;
      state.error = null;
      state.currentPropertyId = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /*
      |--------------------------------------------------------------------------
      | FETCH
      |--------------------------------------------------------------------------
      */
      .addCase(fetchPropertyAmenities.fulfilled, (state, action) => {
        state.amenities = action.payload;
        state.currentPropertyId = action.meta.arg;
      })

      /*
      |--------------------------------------------------------------------------
      | ATTACH
      |--------------------------------------------------------------------------
      */
      .addCase(attachPropertyAmenity.fulfilled, (state, action) => {
        const item = action.payload;

        if (!item) return;

        const exists = state.amenities.some(
          (a) =>
            a.id === item.id ||
            a.amenity_id === item.amenity_id
        );

        if (!exists) {
          state.amenities.push(item);
        }
      })

      /*
      |--------------------------------------------------------------------------
      | UPDATE
      |--------------------------------------------------------------------------
      */
      .addCase(updatePropertyAmenity.fulfilled, (state, action) => {
        const updated = action.payload;

        const index = state.amenities.findIndex(
          (item) =>
            item.id === updated.id ||
            item.amenity_id === updated.amenity_id
        );

        if (index !== -1) {
          state.amenities[index] = updated;
        }
      })

      /*
      |--------------------------------------------------------------------------
      | DELETE
      |--------------------------------------------------------------------------
      */
      .addCase(deletePropertyAmenity.fulfilled, (state, action) => {
        state.amenities = state.amenities.filter(
          (item) =>
            item.id !== action.payload &&
            item.amenity_id !== action.payload
        );
      })

      /*
      |--------------------------------------------------------------------------
      | SYNC
      |--------------------------------------------------------------------------
      */
      .addCase(syncPropertyAmenities.fulfilled, (state, action) => {
        state.amenities = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | GLOBAL PENDING
      |--------------------------------------------------------------------------
      */
      .addMatcher(
        (action) =>
          action.type.startsWith("propertyAmenities/") &&
          action.type.endsWith("/pending"),

        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      /*
      |--------------------------------------------------------------------------
      | GLOBAL REJECTED
      |--------------------------------------------------------------------------
      */
      .addMatcher(
        (action) =>
          action.type.startsWith("propertyAmenities/") &&
          action.type.endsWith("/rejected"),

        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        }
      )

      /*
      |--------------------------------------------------------------------------
      | GLOBAL FULFILLED
      |--------------------------------------------------------------------------
      */
      .addMatcher(
        (action) =>
          action.type.startsWith("propertyAmenities/") &&
          action.type.endsWith("/fulfilled"),

        (state) => {
          state.loading = false;
        }
      );
  },
});

export const { clearAmenitiesState } =
  propertyAmenitySlice.actions;

export default propertyAmenitySlice.reducer;