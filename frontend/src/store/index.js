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
| LEASES
|--------------------------------------------------------------------------
| Manages lease records and lease-related state.
|
| Redux state:
| state.lease
|--------------------------------------------------------------------------
*/
import leaseReducer from "./leaseSlice";

/*
|--------------------------------------------------------------------------
| BOOKINGS
|--------------------------------------------------------------------------
| Manages property bookings, booking workflow, payments, availability,
| statistics and reports.
|
| Redux state:
| state.bookings
|--------------------------------------------------------------------------
*/
import bookingReducer from "./bookingSlice";

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
    tenancy: tenancyReducer,

    /*
    |--------------------------------------------------------------------------
    | LEASES
    |--------------------------------------------------------------------------
    */
    lease: leaseReducer,

    /*
    |--------------------------------------------------------------------------
    | BOOKINGS
    |--------------------------------------------------------------------------
    */
    bookings: bookingReducer,

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
  | Enable Redux DevTools during development and disable them in production.
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