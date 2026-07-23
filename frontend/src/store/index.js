import { configureStore } from "@reduxjs/toolkit";

/*
|--------------------------------------------------------------------------
| CORE AUTH
|--------------------------------------------------------------------------
*/
import authReducer from "./authSlice";

/*
|--------------------------------------------------------------------------
| UI GLOBAL STATE
|--------------------------------------------------------------------------
*/
import uiReducer from "./uiSlice";

/*
|--------------------------------------------------------------------------
| USERS & RBAC
|--------------------------------------------------------------------------
*/
import userReducer from "./userSlice";
import roleReducer from "./roleSlice";
import permissionReducer from "./permissionSlice";
import roleRequestReducer from "./roleRequestSlice";

/*
|--------------------------------------------------------------------------
| USER ACTIVITY LOGS
|--------------------------------------------------------------------------
*/
import userActivityReducer from "./userActivitySlice";

/*
|--------------------------------------------------------------------------
| PROPERTY SYSTEM
|--------------------------------------------------------------------------
*/
import propertyReducer from "./propertySlice";
import propertyCategoryReducer from "./propertyCategorySlice";
import propertyTypeReducer from "./propertyTypeSlice";
import unitReducer from "./unitSlice";

/*
|--------------------------------------------------------------------------
| PROPERTY FEATURES & AMENITIES
|--------------------------------------------------------------------------
*/
import propertyFeatureReducer from "./propertyFeatureSlice";
import propertyAmenityReducer from "./propertyAmenitySlice";
import propertyReviewsReducer from "./propertyReviewSlice";
import  propertyVisitsReducer from "./propertyVisitSlice"
import propertyFavoriteReducer from "./propertyFavoriteSlice";
import propertyAnalyticsReducer from "./propertyAnalyticsSlice";


/*
|--------------------------------------------------------------------------
| STORE CONFIGURATION
|--------------------------------------------------------------------------
*/
export const store = configureStore({
  reducer: {
    // AUTH
    auth: authReducer,

    // UI
    ui: uiReducer,

    // USERS & RBAC
    users: userReducer,
    roles: roleReducer,
    permissions: permissionReducer,
    roleRequests: roleRequestReducer,

    // USER ACTIVITY
    userActivity: userActivityReducer,

    // PROPERTIES
    properties: propertyReducer,
    propertyCategories: propertyCategoryReducer,
    propertyTypes: propertyTypeReducer,
    units: unitReducer,

    // PROPERTY DETAILS
    propertyFeatures: propertyFeatureReducer,
    propertyAmenities: propertyAmenityReducer,
    propertyReviews: propertyReviewsReducer,
    propertyVisits : propertyVisitsReducer,
    propertyFavorites: propertyFavoriteReducer,
    propertyAnalytics: propertyAnalyticsReducer,



  },

  /*
  |--------------------------------------------------------------------------
  | MIDDLEWARE
  |--------------------------------------------------------------------------
  | Redux Toolkit already includes:
  | - redux-thunk
  | - serializable checks
  | - immutable checks
  |--------------------------------------------------------------------------
  */
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: true,
      serializableCheck: false,
      immutableCheck: false,
    }),

  /*
  |--------------------------------------------------------------------------
  | REDUX DEVTOOLS
  |--------------------------------------------------------------------------
  */
  devTools: import.meta.env.MODE !== "production",
});

export default store;