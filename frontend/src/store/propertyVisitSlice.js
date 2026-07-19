import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import PropertyVisitService from "../services/propertyVisit.service";

/*
|--------------------------------------------------------------------------
| Initial State
|--------------------------------------------------------------------------
*/

const initialState = {
  visits: [],
  visit: null,

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
| Fetch All Property Visits
|--------------------------------------------------------------------------
*/

export const fetchPropertyVisits = createAsyncThunk(
  "propertyVisit/fetchPropertyVisits",
  async (params = {}, { rejectWithValue }) => {
    try {
      return await PropertyVisitService.getAll(params);
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
| Fetch Single Property Visit
|--------------------------------------------------------------------------
*/

export const fetchPropertyVisit = createAsyncThunk(
  "propertyVisit/fetchPropertyVisit",
  async (id, { rejectWithValue }) => {
    try {
      return await PropertyVisitService.getById(id);
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
| Create Property Visit
|--------------------------------------------------------------------------
*/

export const createPropertyVisit = createAsyncThunk(
  "propertyVisit/createPropertyVisit",
  async (data, { rejectWithValue }) => {
    try {
      return await PropertyVisitService.create(data);
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
| Update Property Visit
|--------------------------------------------------------------------------
*/

export const updatePropertyVisit = createAsyncThunk(
  "propertyVisit/updatePropertyVisit",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await PropertyVisitService.update(id, data);
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
| Delete Property Visit
|--------------------------------------------------------------------------
*/

export const deletePropertyVisit = createAsyncThunk(
  "propertyVisit/deletePropertyVisit",
  async (id, { rejectWithValue }) => {
    try {
      await PropertyVisitService.delete(id);

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
| Slice
|--------------------------------------------------------------------------
*/

const propertyVisitSlice = createSlice({
  name: "propertyVisit",

  initialState,

  reducers: {
    clearPropertyVisit(state) {
      state.visit = null;
    },

    clearPropertyVisitError(state) {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /*
      |--------------------------------------------------------------------------
      | Fetch Property Visits
      |--------------------------------------------------------------------------
      */

      .addCase(fetchPropertyVisits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchPropertyVisits.fulfilled, (state, action) => {
        state.loading = false;

        state.visits = action.payload.data || [];
        state.meta = action.payload.meta || {};
        state.links = action.payload.links || {};
      })

      .addCase(fetchPropertyVisits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | Fetch Single Property Visit
      |--------------------------------------------------------------------------
      */

      .addCase(fetchPropertyVisit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchPropertyVisit.fulfilled, (state, action) => {
        state.loading = false;
        state.visit = action.payload.data || null;
      })

      .addCase(fetchPropertyVisit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | Create Property Visit
      |--------------------------------------------------------------------------
      */

      .addCase(createPropertyVisit.pending, (state) => {
        state.saving = true;
        state.error = null;
      })

      .addCase(createPropertyVisit.fulfilled, (state, action) => {
        state.saving = false;

        if (action.payload?.data) {
          state.visit = action.payload.data;

          state.visits.unshift(action.payload.data);
        }
      })

      .addCase(createPropertyVisit.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | Update Property Visit
      |--------------------------------------------------------------------------
      */

      .addCase(updatePropertyVisit.pending, (state) => {
        state.saving = true;
        state.error = null;
      })

      .addCase(updatePropertyVisit.fulfilled, (state, action) => {
        state.saving = false;

        if (action.payload?.data) {
          state.visit = action.payload.data;

          state.visits = state.visits.map((visit) =>
            visit.id === action.payload.data.id
              ? action.payload.data
              : visit
          );
        }
      })

      .addCase(updatePropertyVisit.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | Delete Property Visit
      |--------------------------------------------------------------------------
      */

      .addCase(deletePropertyVisit.pending, (state) => {
        state.saving = true;
        state.error = null;
      })

      .addCase(deletePropertyVisit.fulfilled, (state, action) => {
        state.saving = false;

        state.visits = state.visits.filter(
          (visit) => visit.id !== action.payload
        );

        if (state.visit?.id === action.payload) {
          state.visit = null;
        }
      })

      .addCase(deletePropertyVisit.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearPropertyVisit,
  clearPropertyVisitError,
} = propertyVisitSlice.actions;

export default propertyVisitSlice.reducer;