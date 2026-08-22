import { configureStore } from "@reduxjs/toolkit";

/*
|--------------------------------------------------------------------------
| CORE AUTHENTICATION
|--------------------------------------------------------------------------
*/
import authReducer from "./authSlice";

/*
|--------------------------------------------------------------------------
| GLOBAL UI STATE
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
| TENANTS
|--------------------------------------------------------------------------
*/
import tenantReducer from "./tenantSlice";

/*
|--------------------------------------------------------------------------
| TENANCIES
|--------------------------------------------------------------------------
*/
import tenancyReducer from "./tenancySlice";

/*
|--------------------------------------------------------------------------
| USER ACTIVITY
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

/*
|--------------------------------------------------------------------------
| PROPERTY ENGAGEMENT
|--------------------------------------------------------------------------
*/
import propertyReviewReducer from "./propertyReviewSlice";
import propertyVisitReducer from "./propertyVisitSlice";
import propertyFavoriteReducer from "./propertyFavoriteSlice";
import propertyAnalyticsReducer from "./propertyAnalyticsSlice";

/*
|--------------------------------------------------------------------------
| STORE CONFIGURATION
|--------------------------------------------------------------------------
*/

export const store = configureStore({
  reducer: {
    /*
    |--------------------------------------------------------------------------
    | AUTHENTICATION
    |--------------------------------------------------------------------------
    */
    auth: authReducer,

    /*
    |--------------------------------------------------------------------------
    | GLOBAL UI
    |--------------------------------------------------------------------------
    */
    ui: uiReducer,

    /*
    |--------------------------------------------------------------------------
    | USERS & RBAC
    |--------------------------------------------------------------------------
    */
    users: userReducer,
    roles: roleReducer,
    permissions: permissionReducer,
    roleRequests: roleRequestReducer,

    /*
    |--------------------------------------------------------------------------
    | TENANTS
    |--------------------------------------------------------------------------
    */
    tenants: tenantReducer,

    /*
    |--------------------------------------------------------------------------
    | TENANCIES
    |--------------------------------------------------------------------------
    */
    tenancies: tenancyReducer,

    /*
    |--------------------------------------------------------------------------
    | USER ACTIVITY
    |--------------------------------------------------------------------------
    */
    userActivity: userActivityReducer,

    /*
    |--------------------------------------------------------------------------
    | PROPERTY SYSTEM
    |--------------------------------------------------------------------------
    */
    properties: propertyReducer,
    propertyCategories: propertyCategoryReducer,
    propertyTypes: propertyTypeReducer,
    units: unitReducer,

    /*
    |--------------------------------------------------------------------------
    | PROPERTY FEATURES & AMENITIES
    |--------------------------------------------------------------------------
    */
    propertyFeatures: propertyFeatureReducer,
    propertyAmenities: propertyAmenityReducer,

    /*
    |--------------------------------------------------------------------------
    | PROPERTY ENGAGEMENT
    |--------------------------------------------------------------------------
    */
    propertyReviews: propertyReviewReducer,
    propertyVisits: propertyVisitReducer,
    propertyFavorites: propertyFavoriteReducer,
    propertyAnalytics: propertyAnalyticsReducer,
  },

  /*
  |--------------------------------------------------------------------------
  | MIDDLEWARE
  |--------------------------------------------------------------------------
  | Redux Toolkit already includes:
  | - redux-thunk
  | - Serializable State Invariant Middleware
  | - Immutable State Invariant Middleware
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

/*
|--------------------------------------------------------------------------
| DEFAULT EXPORT
|--------------------------------------------------------------------------
*/

export default store;