import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import PropertyReviewService from "../services/propertyReview.service";

/*
|--------------------------------------------------------------------------
| Initial State
|--------------------------------------------------------------------------
*/

const initialState = {
  reviews: [],
  review: null,
  summary: null,

  meta: {
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
    from: 0,
    to: 0,
    has_more_pages: false,
  },

  links: {
    first: null,
    last: null,
    prev: null,
    next: null,
  },

  loading: false,
  saving: false,
  error: null,
};

/*
|--------------------------------------------------------------------------
| Fetch All Reviews
|--------------------------------------------------------------------------
*/

export const fetchPropertyReviews = createAsyncThunk(
  "propertyReview/fetchPropertyReviews",
  async (params = {}, { rejectWithValue }) => {
    try {
      return await PropertyReviewService.getAll(params);
    } catch (error) {
      return rejectWithValue(
        error.response?.data ?? {
          message: error.message,
        }
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| Fetch Single Review
|--------------------------------------------------------------------------
*/

export const fetchPropertyReview = createAsyncThunk(
  "propertyReview/fetchPropertyReview",
  async (id, { rejectWithValue }) => {
    try {
      return await PropertyReviewService.getById(id);
    } catch (error) {
      return rejectWithValue(
        error.response?.data ?? {
          message: error.message,
        }
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| Fetch Summary
|--------------------------------------------------------------------------
*/

export const fetchPropertyReviewSummary = createAsyncThunk(
  "propertyReview/fetchSummary",
  async (params = {}, { rejectWithValue }) => {
    try {
      return await PropertyReviewService.getSummary(params);
    } catch (error) {
      return rejectWithValue(
        error.response?.data ?? {
          message: error.message,
        }
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| Update Review
|--------------------------------------------------------------------------
*/

export const updatePropertyReview = createAsyncThunk(
  "propertyReview/updatePropertyReview",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await PropertyReviewService.update(id, data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data ?? {
          message: error.message,
        }
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| Delete Review
|--------------------------------------------------------------------------
*/

export const deletePropertyReview = createAsyncThunk(
  "propertyReview/deletePropertyReview",
  async (id, { rejectWithValue }) => {
    try {
      await PropertyReviewService.delete(id);

      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data ?? {
          message: error.message,
        }
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| Publish Review
|--------------------------------------------------------------------------
*/

export const publishPropertyReview = createAsyncThunk(
  "propertyReview/publishPropertyReview",
  async (id, { rejectWithValue }) => {
    try {
      return await PropertyReviewService.publish(id);
    } catch (error) {
      return rejectWithValue(
        error.response?.data ?? {
          message: error.message,
        }
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| Unpublish Review
|--------------------------------------------------------------------------
*/

export const unpublishPropertyReview = createAsyncThunk(
  "propertyReview/unpublishPropertyReview",
  async (id, { rejectWithValue }) => {
    try {
      return await PropertyReviewService.unpublish(id);
    } catch (error) {
      return rejectWithValue(
        error.response?.data ?? {
          message: error.message,
        }
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| Verify Review
|--------------------------------------------------------------------------
*/

export const verifyPropertyReview = createAsyncThunk(
  "propertyReview/verifyPropertyReview",
  async (id, { rejectWithValue }) => {
    try {
      return await PropertyReviewService.verify(id);
    } catch (error) {
      return rejectWithValue(
        error.response?.data ?? {
          message: error.message,
        }
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| Unverify Review
|--------------------------------------------------------------------------
*/

export const unverifyPropertyReview = createAsyncThunk(
  "propertyReview/unverifyPropertyReview",
  async (id, { rejectWithValue }) => {
    try {
      return await PropertyReviewService.unverify(id);
    } catch (error) {
      return rejectWithValue(
        error.response?.data ?? {
          message: error.message,
        }
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| Toggle Publish
|--------------------------------------------------------------------------
*/

export const togglePublishPropertyReview = createAsyncThunk(
  "propertyReview/togglePublishPropertyReview",
  async (id, { rejectWithValue }) => {
    try {
      return await PropertyReviewService.togglePublish(id);
    } catch (error) {
      return rejectWithValue(
        error.response?.data ?? {
          message: error.message,
        }
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| Toggle Verification
|--------------------------------------------------------------------------
*/

export const toggleVerificationPropertyReview = createAsyncThunk(
  "propertyReview/toggleVerificationPropertyReview",
  async (id, { rejectWithValue }) => {
    try {
      return await PropertyReviewService.toggleVerification(id);
    } catch (error) {
      return rejectWithValue(
        error.response?.data ?? {
          message: error.message,
        }
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| Like Review
|--------------------------------------------------------------------------
*/

export const likePropertyReview = createAsyncThunk(
  "propertyReview/likePropertyReview",
  async (id, { rejectWithValue }) => {
    try {
      return await PropertyReviewService.like(id);
    } catch (error) {
      return rejectWithValue(
        error.response?.data ?? {
          message: error.message,
        }
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| Unlike Review
|--------------------------------------------------------------------------
*/

export const unlikePropertyReview = createAsyncThunk(
  "propertyReview/unlikePropertyReview",
  async (id, { rejectWithValue }) => {
    try {
      return await PropertyReviewService.unlike(id);
    } catch (error) {
      return rejectWithValue(
        error.response?.data ?? {
          message: error.message,
        }
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| Slice
|--------------------------------------------------------------------------
*/

const propertyReviewSlice = createSlice({
  name: "propertyReview",

  initialState,

  reducers: {
    clearPropertyReview(state) {
      state.review = null;
    },

    clearPropertyReviewSummary(state) {
      state.summary = null;
    },

    clearPropertyReviewError(state) {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /*
      |--------------------------------------------------------------------------
      | Fetch Reviews
      |--------------------------------------------------------------------------
      */

      .addCase(fetchPropertyReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchPropertyReviews.fulfilled, (state, action) => {
        state.loading = false;

        state.reviews = action.payload.data || [];
        state.meta = action.payload.meta || {};
        state.links = action.payload.links || {};
      })

      .addCase(fetchPropertyReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | Fetch Single Review
      |--------------------------------------------------------------------------
      */

      .addCase(fetchPropertyReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchPropertyReview.fulfilled, (state, action) => {
        state.loading = false;
        state.review = action.payload.data || null;
      })

      .addCase(fetchPropertyReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | Fetch Summary
      |--------------------------------------------------------------------------
      */

      .addCase(fetchPropertyReviewSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchPropertyReviewSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload.data || null;
      })

      .addCase(fetchPropertyReviewSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | Update Review
      |--------------------------------------------------------------------------
      */

      .addCase(updatePropertyReview.pending, (state) => {
        state.saving = true;
        state.error = null;
      })

      .addCase(updatePropertyReview.fulfilled, (state, action) => {
        state.saving = false;

        if (action.payload?.data) {
          state.review = action.payload.data;

          state.reviews = state.reviews.map((review) =>
            review.id === action.payload.data.id
              ? action.payload.data
              : review
          );
        }
      })

      .addCase(updatePropertyReview.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | Delete Review
      |--------------------------------------------------------------------------
      */

      .addCase(deletePropertyReview.pending, (state) => {
        state.saving = true;
        state.error = null;
      })

      .addCase(deletePropertyReview.fulfilled, (state, action) => {
        state.saving = false;

        state.reviews = state.reviews.filter(
          (review) => review.id !== action.payload
        );

        if (state.review?.id === action.payload) {
          state.review = null;
        }
      })

      .addCase(deletePropertyReview.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | Publish
      |--------------------------------------------------------------------------
      */

      .addCase(publishPropertyReview.pending, (state) => {
        state.saving = true;
      })

      .addCase(publishPropertyReview.fulfilled, (state) => {
        state.saving = false;

        if (state.review) {
          state.review.is_published = true;
        }
      })

      .addCase(publishPropertyReview.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | Unpublish
      |--------------------------------------------------------------------------
      */

      .addCase(unpublishPropertyReview.pending, (state) => {
        state.saving = true;
      })

      .addCase(unpublishPropertyReview.fulfilled, (state) => {
        state.saving = false;

        if (state.review) {
          state.review.is_published = false;
        }
      })

      .addCase(unpublishPropertyReview.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | Verify
      |--------------------------------------------------------------------------
      */

      .addCase(verifyPropertyReview.pending, (state) => {
        state.saving = true;
      })

      .addCase(verifyPropertyReview.fulfilled, (state) => {
        state.saving = false;

        if (state.review) {
          state.review.is_verified = true;
        }
      })

      .addCase(verifyPropertyReview.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | Unverify
      |--------------------------------------------------------------------------
      */

      .addCase(unverifyPropertyReview.pending, (state) => {
        state.saving = true;
      })

      .addCase(unverifyPropertyReview.fulfilled, (state) => {
        state.saving = false;

        if (state.review) {
          state.review.is_verified = false;
        }
      })

      .addCase(unverifyPropertyReview.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | Toggle Publish
      |--------------------------------------------------------------------------
      */

      .addCase(togglePublishPropertyReview.fulfilled, (state) => {
        if (state.review) {
          state.review.is_published = !state.review.is_published;
        }
      })

      /*
      |--------------------------------------------------------------------------
      | Toggle Verification
      |--------------------------------------------------------------------------
      */

      .addCase(toggleVerificationPropertyReview.fulfilled, (state) => {
        if (state.review) {
          state.review.is_verified = !state.review.is_verified;
        }
      })

      /*
      |--------------------------------------------------------------------------
      | Like
      |--------------------------------------------------------------------------
      */

      .addCase(likePropertyReview.fulfilled, (state) => {
        if (state.review) {
          state.review.likes_count =
            (state.review.likes_count || 0) + 1;
        }
      })

      /*
      |--------------------------------------------------------------------------
      | Unlike
      |--------------------------------------------------------------------------
      */

      .addCase(unlikePropertyReview.fulfilled, (state) => {
        if (state.review && state.review.likes_count > 0) {
          state.review.likes_count--;
        }
      });
  },
});
export const {
  clearPropertyReview,
  clearPropertyReviewSummary,
  clearPropertyReviewError,
} = propertyReviewSlice.actions;

export default propertyReviewSlice.reducer;