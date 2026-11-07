import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";

/*
|--------------------------------------------------------------------------
| GLOBAL UI STATE
|--------------------------------------------------------------------------
*/
import uiReducer from "./uiSlice";

/*
|--------------------------------------------------------------------------
| USERS & ROLE-BASED ACCESS CONTROL (RBAC)
|--------------------------------------------------------------------------
*/
import userReducer from "./userSlice";
import roleReducer from "./roleSlice";
import permissionReducer from "./permissionSlice";
import roleRequestReducer from "./roleRequestSlice";

/*
|--------------------------------------------------------------------------
| TENANT MANAGEMENT
|--------------------------------------------------------------------------
*/
import tenantReducer from "./tenantSlice";

/*
|--------------------------------------------------------------------------
| TENANCY MANAGEMENT
|--------------------------------------------------------------------------
*/
import tenancyReducer from "./tenancySlice";

/*
|--------------------------------------------------------------------------
| LEASE MANAGEMENT
|--------------------------------------------------------------------------
*/
import leaseReducer from "./leaseSlice";

/*
|--------------------------------------------------------------------------
| BOOKING MANAGEMENT
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
| PROPERTY MANAGEMENT
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
| PROPERTY ENGAGEMENT & ANALYTICS
|--------------------------------------------------------------------------
*/
import propertyReviewReducer from "./propertyReviewSlice";
import propertyVisitReducer from "./propertyVisitSlice";
import propertyFavoriteReducer from "./propertyFavoriteSlice";
import propertyAnalyticsReducer from "./propertyAnalyticsSlice";

/*
|--------------------------------------------------------------------------
| PLOT MANAGEMENT
|--------------------------------------------------------------------------
*/
import plotReducer from "./plotSlice";

/*
|--------------------------------------------------------------------------
| PLOT SALES MANAGEMENT
|--------------------------------------------------------------------------
*/
import plotSalesReducer from "./plotSalesSlice";

/*
|--------------------------------------------------------------------------
| PLOT PAYMENTS MANAGEMENT
|--------------------------------------------------------------------------
*/
import plotPaymentReducer from "./plotPaymentSlice";

/*
|--------------------------------------------------------------------------
| REDUX STORE CONFIGURATION
|--------------------------------------------------------------------------
*/

export const store = configureStore({
  reducer: {
    /*
    |--------------------------------------------------------------------------
    | AUTHENTICATION & GLOBAL UI
    |--------------------------------------------------------------------------
    */
    auth: authReducer,
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
    | TENANT & TENANCY MANAGEMENT
    |--------------------------------------------------------------------------
    */
    tenants: tenantReducer,
    tenancy: tenancyReducer,
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
    | PROPERTY MANAGEMENT
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
    | PROPERTY ENGAGEMENT & ANALYTICS
    |--------------------------------------------------------------------------
    */
    propertyReviews: propertyReviewReducer,
    propertyVisits: propertyVisitReducer,
    propertyFavorites: propertyFavoriteReducer,
    propertyAnalytics: propertyAnalyticsReducer,

    /*
    |--------------------------------------------------------------------------
    | PLOT MANAGEMENT
    |--------------------------------------------------------------------------
    */
    plots: plotReducer,

    /*
    |--------------------------------------------------------------------------
    | PLOT SALES MANAGEMENT
    |--------------------------------------------------------------------------
    */
    plotSales: plotSalesReducer,

    /*
    |--------------------------------------------------------------------------
    | PLOT PAYMENTS MANAGEMENT
    |--------------------------------------------------------------------------
    */
    plotPayments: plotPaymentReducer,
  },

  /*
  |--------------------------------------------------------------------------
  | MIDDLEWARE
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
  | Enabled in development and disabled in production.
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