import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apartmentService from "../services/apartment.service";


// Get all apartments
export const fetchApartments = createAsyncThunk(
  "apartments/fetchAll",
  async (params = {}, { rejectWithValue }) => {

    try {

      return await apartmentService.getAll(params);

    } catch (error) {

      return rejectWithValue(error);

    }

  }
);





// Get single apartment
export const fetchApartmentById = createAsyncThunk(
  "apartments/fetchById",
  async (id, { rejectWithValue }) => {

    try {

      return await apartmentService.getById(id);

    } catch (error) {

      return rejectWithValue(error);

    }

  }
);

// Create apartment
export const createApartment = createAsyncThunk(
  "apartments/create",
  async (payload, { rejectWithValue }) => {

    try {

      return await apartmentService.create(payload);

    } catch (error) {

      return rejectWithValue(error);

    }

  }
);
// Update apartment
export const updateApartment = createAsyncThunk(
  "apartments/update",
  async ({ id, data }, { rejectWithValue }) => {

    try {

      return await apartmentService.update(id, data);

    } catch (error) {

      return rejectWithValue(error);

    }

  }
);





// Delete apartment
export const deleteApartment = createAsyncThunk(
  "apartments/delete",
  async (id, { rejectWithValue }) => {

    try {

      await apartmentService.delete(id);

      return id;

    } catch (error) {

      return rejectWithValue(error);

    }

  }
);





// Get apartments by property
export const fetchApartmentsByProperty = createAsyncThunk(
  "apartments/fetchByProperty",
  async (
    { propertyId, params = {} },
    { rejectWithValue }
  ) => {

    try {

      return await apartmentService.getByProperty(
        propertyId,
        params
      );

    } catch (error) {

      return rejectWithValue(error);

    }

  }
);

// Get apartment units
export const fetchApartmentUnits = createAsyncThunk(
  "apartments/fetchUnits",
  async (id, { rejectWithValue }) => {

    try {

      return await apartmentService.getUnits(id);

    } catch (error) {

      return rejectWithValue(error);

    }

  }
);



/* -------------------------------------------------------------------------- */
/*                                Initial State                               */
/* -------------------------------------------------------------------------- */


const initialState = {


  apartments: [],

  apartmentDetails: null,

  apartmentUnits: [],


  loading: false,

  actionLoading: false,


  success: false,

  error: null,

  message: "",



  pagination: {

    currentPage: 1,

    lastPage: 1,

    perPage: 10,

    total: 0,

  },


};




/* -------------------------------------------------------------------------- */
/*                                   Slice                                    */
/* -------------------------------------------------------------------------- */


const apartmentSlice = createSlice({

  name: "apartments",

  initialState,


  reducers: {


    clearApartmentError(state) {

      state.error = null;

    },


    clearApartmentMessage(state) {

      state.message = "";

    },


    clearApartmentDetails(state) {

      state.apartmentDetails = null;

    },


    resetApartmentState(state) {

      state.loading = false;

      state.actionLoading = false;

      state.success = false;

      state.error = null;

      state.message = "";

    },


  },



  extraReducers: (builder) => {


    builder


    /* ================= FETCH ALL ================= */


    .addCase(
      fetchApartments.pending,
      (state) => {

        state.loading = true;

        state.error = null;

      }
    )
    .addCase(
      fetchApartments.fulfilled,
      (state, action) => {
        state.loading = false;
        state.success = true;
        const payload = action.payload;
        if(payload?.data?.data){
          state.apartments =
            payload.data.data;
          state.pagination = {
            currentPage:
              payload.data.current_page,
            lastPage:
              payload.data.last_page,
            perPage:
              payload.data.per_page,
            total:
              payload.data.total,
          };
        } else {


          // Collection

          state.apartments =
            payload.data || [];


        }



        state.message =
          payload.message || "";


      }
    )



    .addCase(
      fetchApartments.rejected,
      (state, action) => {


        state.loading = false;


        state.error =
          action.payload?.message ||
          "Failed to fetch apartments.";

      }
    )





    /* ================= FETCH ONE ================= */



    .addCase(
      fetchApartmentById.pending,
      (state)=>{

        state.loading = true;

      }
    )



    .addCase(
      fetchApartmentById.fulfilled,
      (state, action)=>{


        state.loading = false;


        state.apartmentDetails =
          action.payload.data;


        state.message =
          action.payload.message || "";


      }
    )



    .addCase(
      fetchApartmentById.rejected,
      (state, action)=>{


        state.loading = false;


        state.error =
          action.payload?.message ||
          "Failed to fetch apartment details.";

      }
    )
    /* ================= CREATE ================= */



    .addCase(
      createApartment.pending,
      (state)=>{

        state.actionLoading = true;

      }
    )



    .addCase(
      createApartment.fulfilled,
      (state, action)=>{


        state.actionLoading = false;


        state.apartments.unshift(
          action.payload.data
        );


        state.message =
          action.payload.message ||
          "Apartment created successfully.";

      }
    )



    .addCase(
      createApartment.rejected,
      (state, action)=>{


        state.actionLoading = false;


        state.error =
          action.payload?.message ||
          "Failed to create apartment.";

      }
    )

    /* ================= UPDATE ================= */
    .addCase(
      updateApartment.pending,
      (state)=>{

        state.actionLoading = true;

      }
    )



    .addCase(
      updateApartment.fulfilled,
      (state, action)=>{


        state.actionLoading = false;



        const updated =
          action.payload.data;



        state.apartments =
          state.apartments.map(
            (item)=>
              item.id === updated.id
                ? updated
                : item
          );



        if(
          state.apartmentDetails &&
          state.apartmentDetails.id === updated.id
        ){

          state.apartmentDetails = updated;

        }



        state.message =
          action.payload.message ||
          "Apartment updated successfully.";

      }
    )



    .addCase(
      updateApartment.rejected,
      (state, action)=>{


        state.actionLoading = false;


        state.error =
          action.payload?.message ||
          "Failed to update apartment.";

      }
    )

    /* ================= DELETE ================= */
    .addCase(
      deleteApartment.pending,
      (state)=>{

        state.actionLoading = true;

      }
    )



    .addCase(
      deleteApartment.fulfilled,
      (state, action)=>{


        state.actionLoading = false;



        state.apartments =
          state.apartments.filter(
            (item)=>
              item.id !== action.payload
          );



        state.message =
          "Apartment deleted successfully.";

      }
    )



    .addCase(
      deleteApartment.rejected,
      (state, action)=>{


        state.actionLoading = false;


        state.error =
          action.payload?.message ||
          "Failed to delete apartment.";

      }
    )







    /* ================= FETCH UNITS ================= */



    .addCase(
      fetchApartmentUnits.fulfilled,
      (state, action)=>{


        state.apartmentUnits =
          action.payload.data || [];


      }
    );
  },
});

/* -------------------------------------------------------------------------- */
/*                                   Export                                   */
/* -------------------------------------------------------------------------- */


export const {

  clearApartmentError,

  clearApartmentMessage,

  clearApartmentDetails,

  resetApartmentState,

} = apartmentSlice.actions;

export default apartmentSlice.reducer;