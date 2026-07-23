import { Route, Navigate } from "react-router-dom";

/*
|--------------------------------------------------------------------------
| GUARDS
|--------------------------------------------------------------------------
*/
import PermissionGuard from "../auth/guards/PermissionGuard";

/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
*/
import Dashboard from "../modules/super-admin/dashboard/Dashboard";

/*
|--------------------------------------------------------------------------
| USERS
|--------------------------------------------------------------------------
*/
import UsersList from "../modules/super-admin/users/UsersList";
import CreateUser from "../modules/super-admin/users/CreateUser";
import EditUser from "../modules/super-admin/users/EditUser";

/*
|--------------------------------------------------------------------------
| ROLES
|--------------------------------------------------------------------------
*/
import RolesList from "../modules/super-admin/roles/RolesList";
import CreateRole from "../modules/super-admin/roles/CreateRole";
import EditRole from "../modules/super-admin/roles/EditRole";
import AssignPermissions from "../modules/super-admin/roles/AssignPermissions";

/*
|--------------------------------------------------------------------------
| PERMISSIONS
|--------------------------------------------------------------------------
*/
import PermissionsList from "../modules/super-admin/permissions/PermissionList";
import CreatePermission from "../modules/super-admin/permissions/CreatePermission";
import EditPermission from "../modules/super-admin/permissions/EditPermission";

/*
|--------------------------------------------------------------------------
| ROLE REQUESTS (NEW MODULE)
|--------------------------------------------------------------------------
*/
import RoleRequestList from "../modules/super-admin/role-requests/RoleRequestsList";
import RoleRequestDetail from "../modules/super-admin/role-requests/RoleRequestDetail";

/*
|--------------------------------------------------------------------------
| PROPERTY TYPES
|--------------------------------------------------------------------------
*/
import PropertyTypeList from "../modules/super-admin/propertyTypes/PropertyTypeList";
import PropertyTypeCreate from "../modules/super-admin/propertyTypes/PropertyTypeCreate";
import PropertyTypeEdit from "../modules/super-admin/propertyTypes/PropertyTypeEdit";
import PropertyTypeShow from "../modules/super-admin/propertyTypes/PropertyTypeShow";


/*
|--------------------------------------------------------------------------
| PROPERTY FEATURES
|--------------------------------------------------------------------------
*/
import PropertyFeatureList from "../modules/super-admin/propertyFeatures/PropertyFeatureList";
import PropertyFeatureCreate from "../modules/super-admin/propertyFeatures/PropertyFeatureCreate";
import PropertyFeatureEdit from "../modules/super-admin/propertyFeatures/PropertyFeatureEdit";
import PropertyFeatureShow from "../modules/super-admin/propertyFeatures/PropertyFeatureShow";

/*
|--------------------------------------------------------------------------
| PROPERTY CATEGORIES
|--------------------------------------------------------------------------
*/
import PropertyCategoryList from "../modules/super-admin/propertyCategories/PropertyCategoryList";
import PropertyCategoryCreate from "../modules/super-admin/propertyCategories/PropertyCategoryCreate";
import PropertyCategoryEdit from "../modules/super-admin/propertyCategories/PropertyCategoryEdit";
import PropertyCategoryShow from "../modules/super-admin/propertyCategories/PropertyCategoryShow";

/*
|--------------------------------------------------------------------------
| PROPERTIES
|--------------------------------------------------------------------------
*/
import PropertiesList from "../modules/super-admin/properties/PropertiesList";
import CreateProperty from "../modules/super-admin/properties/CreateProperty";
import EditProperty from "../modules/super-admin/properties/EditProperty";
import PropertyDetails from "../modules/super-admin/properties/PropertyDetails";

/*
|--------------------------------------------------------------------------
| UNITS
|--------------------------------------------------------------------------
*/
import UnitsList from "../modules/super-admin/units/UnitList";
import CreateUnit from "../modules/super-admin/units/CreateUnit";
import EditUnit from "../modules/super-admin/units/EditUnit";
import UnitDetails from "../modules/super-admin/units/UnitDetails";

/*
|--------------------------------------------------------------------------
| PROPERTY AMENITIES (NEW)
|--------------------------------------------------------------------------
*/
import AmenityList from "../modules/super-admin/Amenities/AmenityList";
import AmenityCreate from "../modules/super-admin/Amenities/AmenityCreate";
import AmenityEdit from "../modules/super-admin/Amenities/AmenityEdit";
import AmenityShow from "../modules/super-admin/Amenities/AmenityShow";
import UserActivityList from "../modules/super-admin/activities/UserActivityList";
import UserActivityDetail from "../modules/super-admin/activities/UserActivityDetail";
import PropertyFeatureIndex from "../modules/super-admin/properties/PropertyFeatureIndex";
import PropertyAmenityIndex from "../modules/super-admin/properties/PropertyAmenityIndex";
import ProfileUser from "../modules/super-admin/profile/ProfileUser";
import PropertyReviewList from "../modules/super-admin/PropertyReview/PropertyReviewList";
import EditPropertyReview from "../modules/super-admin/PropertyReview/EditPropertyReview";
import PropertyReviewDetails from "../modules/super-admin/PropertyReview/PropertyReviewDetails";
import PropertyReviewAnalytic from "../modules/super-admin/PropertyReview/PropertyReviewAnalytics";
import PropertyReviewReports from "../modules/super-admin/PropertyReview/PropertyReviewReports";
import PropertyVisitList from "../modules/super-admin/propertyVisits/PropertyVistList";
import PropertyVisitCreate from "../modules/super-admin/propertyVisits/PropertyVisitCreate";
import PropertyVisitShow from "../modules/super-admin/propertyVisits/PropertyVisitShow";
import PropertyFavoriteList from "../modules/super-admin/propertyFavorite/PropertyFavoriteList";
import CreatePropertyFavorite from "../modules/super-admin/propertyFavorite/CreatePropertyFavorite";
import EditPropertyFavorite from "../modules/super-admin/propertyFavorite/EditPropertyFavorite";
import { PropertyAnalyticsList } from "../modules/super-admin/property-analytics";

/*
|--------------------------------------------------------------------------
| ROUTES
|--------------------------------------------------------------------------
*/
const SuperAdminRoutes = () => {
  return (
    <>
      {/* DEFAULT */}
      <Route index element={<Navigate to="dashboard" replace />} />

      {/* DASHBOARD */}
      <Route
        path="dashboard"
        element={
          <PermissionGuard permission="system.manage">
            <Dashboard />
          </PermissionGuard>
        }
      />

      {/* USERS */}
      <Route
        path="users"
        element={
          <PermissionGuard permission="users.view">
            <UsersList />
          </PermissionGuard>
        }
      />
      <Route
        path="users/create"
        element={
          <PermissionGuard permission="users.create">
            <CreateUser />
          </PermissionGuard>
        }
      />
      <Route
        path="users/:id/edit"
        element={
          <PermissionGuard permission="users.edit">
            <EditUser />
          </PermissionGuard>
        }
      />
      <Route
        path="profile"
        element={
          <PermissionGuard permission="profile.view">
            <ProfileUser />
          </PermissionGuard>
        }
      />

      {/* ROLES */}
      <Route
        path="roles"
        element={
          <PermissionGuard permission="roles.view">
            <RolesList />
          </PermissionGuard>
        }
      />
      <Route
        path="roles/create"
        element={
          <PermissionGuard permission="roles.create">
            <CreateRole />
          </PermissionGuard>
        }
      />
      <Route
        path="roles/edit/:id"
        element={
          <PermissionGuard permission="roles.edit">
            <EditRole />
          </PermissionGuard>
        }
      />
      <Route
        path="roles/:id/permissions"
        element={
          <PermissionGuard permission="roles.assign">
            <AssignPermissions />
          </PermissionGuard>
        }
      />

      {/* ROLE REQUESTS (NEW) */}
      <Route
        path="role-requests"
        element={
          <PermissionGuard permission="roles.view">
            <RoleRequestList />
          </PermissionGuard>
        }
      />

      <Route
        path="role-requests/:id"
        element={
          <PermissionGuard permission="roles.manage">
            <RoleRequestDetail />
          </PermissionGuard>
        }
      />


      {/* 🔥 USER ACTIVITY (NEW) */}
      <Route
        path="activities"
        element={
          <PermissionGuard permission="system.manage">
            <UserActivityList />
          </PermissionGuard>}
      />

      <Route
        path="activities/:id"
        element={
          <PermissionGuard permission="system.manage">
            <UserActivityDetail />
          </PermissionGuard>} />


      {/* PERMISSIONS */}
      <Route
        path="permissions"
        element={
          <PermissionGuard permission="permissions.view">
            <PermissionsList />
          </PermissionGuard>
        }
      />
      <Route
        path="permissions/create"
        element={
          <PermissionGuard permission="permissions.create">
            <CreatePermission />
          </PermissionGuard>
        }
      />
      <Route
        path="permissions/edit/:id"
        element={
          <PermissionGuard permission="permissions.edit">
            <EditPermission />
          </PermissionGuard>
        }
      />

      {/* PROPERTY TYPES */}
      <Route
        path="property-types"
        element={
          <PermissionGuard permission="property_types.view">
            <PropertyTypeList />
          </PermissionGuard>
        }
      />
      <Route
        path="property-types/create"
        element={
          <PermissionGuard permission="property_types.create">
            <PropertyTypeCreate />
          </PermissionGuard>
        }
      />
      <Route
        path="property-types/edit/:id"
        element={
          <PermissionGuard permission="property_types.edit">
            <PropertyTypeEdit />
          </PermissionGuard>
        }
      />
      <Route
        path="property-types/:id"
        element={
          <PermissionGuard permission="property_types.view">
            <PropertyTypeShow />
          </PermissionGuard>
        }
      />

      {/* PROPERTY FEATURES */}
      <Route
        path="property-features"
        element={
          <PermissionGuard permission="property_features.view">
            <PropertyFeatureList />
          </PermissionGuard>
        }
      />
      <Route
        path="property-features/create"
        element={
          <PermissionGuard permission="property_features.create">
            <PropertyFeatureCreate />
          </PermissionGuard>
        }
      />
      <Route
        path="property-features/edit/:id"
        element={
          <PermissionGuard permission="property_features.edit">
            <PropertyFeatureEdit />
          </PermissionGuard>
        }
      />
      <Route
        path="property-features/:id"
        element={
          <PermissionGuard permission="property_features.view">
            <PropertyFeatureShow />
          </PermissionGuard>
        }
      />

      {/* PROPERTY CATEGORIES */}
      <Route
        path="property-categories"
        element={
          <PermissionGuard permission="property_categories.view">
            <PropertyCategoryList />
          </PermissionGuard>
        }
      />
      <Route
        path="property-categories/create"
        element={
          <PermissionGuard permission="property_categories.create">
            <PropertyCategoryCreate />
          </PermissionGuard>
        }
      />
      <Route
        path="property-categories/edit/:id"
        element={
          <PermissionGuard permission="property_categories.edit">
            <PropertyCategoryEdit />
          </PermissionGuard>
        }
      />
      <Route
        path="property-categories/:id"
        element={
          <PermissionGuard permission="property_categories.view">
            <PropertyCategoryShow />
          </PermissionGuard>
        }
      />

      {/* PROPERTIES */}
      <Route
        path="properties"
        element={
          <PermissionGuard permission="properties.view">
            <PropertiesList />
          </PermissionGuard>
        }
      />
      <Route
        path="properties/create"
        element={
          <PermissionGuard permission="properties.create">
            <CreateProperty />
          </PermissionGuard>
        }
      />
      <Route
        path="properties/edit/:id"
        element={
          <PermissionGuard permission="properties.edit">
            <EditProperty />
          </PermissionGuard>
        }
      />
      <Route
        path="properties/:id"
        element={
          <PermissionGuard permission="properties.view">
            <PropertyDetails />
          </PermissionGuard>
        }
      />

      <Route
        path="property-feature-assignments"
        element={
          <PermissionGuard permission="property_features.view">
            <PropertyFeatureIndex />
          </PermissionGuard>
        }
      />

      <Route
        path="property-amenity-assignments"
        element={
          <PermissionGuard permission="property-amenity.view">
            <PropertyAmenityIndex />
          </PermissionGuard>
        }
      />

      {/* UNITS */}
      <Route
        path="units"
        element={
          <PermissionGuard permission="units.view">
            <UnitsList />
          </PermissionGuard>
        }
      />
      <Route
        path="units/create"
        element={
          <PermissionGuard permission="units.create">
            <CreateUnit />
          </PermissionGuard>
        }
      />
      <Route
        path="units/edit/:id"
        element={
          <PermissionGuard permission="units.edit">
            <EditUnit />
          </PermissionGuard>
        }
      />
      <Route
        path="units/:id"
        element={
          <PermissionGuard permission="units.view">
            <UnitDetails />
          </PermissionGuard>
        }
      />

      {/* AMENITIES */}
      <Route
        path="property-amenities"
        element={
          <PermissionGuard permission="property_amenities.view">
            <AmenityList />
          </PermissionGuard>
        }
      />
      <Route
        path="property-amenities/create"
        element={
          <PermissionGuard permission="property_amenities.create">
            <AmenityCreate />
          </PermissionGuard>
        }
      />
      <Route
        path="property-amenities/edit/:id"
        element={
          <PermissionGuard permission="property_amenities.edit">
            <AmenityEdit />
          </PermissionGuard>
        }
      />
      <Route
        path="property-amenities/:id"
        element={
          <PermissionGuard permission="property_amenities.view">
            <AmenityShow />
          </PermissionGuard>
        }
      />
      {/* PROPERTY REVIEW */}

      <Route
        path="property-reviews"
        element={
          <PermissionGuard permission="property-reviews.view">
            <PropertyReviewList />
          </PermissionGuard>
        }
      />
      <Route
        path="property-reviews/analytics"
        element={
          <PermissionGuard permission="property-reviews.view">
            <PropertyReviewAnalytic />
          </PermissionGuard>
        }
      />

      <Route
        path="property-reviews/reports"
        element={
          <PermissionGuard permission="property-reviews.view">
            <PropertyReviewReports />
          </PermissionGuard>
        }
      />

      <Route
        path="property-reviews/:id"
        element={
          <PermissionGuard permission="property-reviews.view">
            <PropertyReviewDetails />
          </PermissionGuard>
        }
      />

      <Route
        path="property-reviews/edit/:id"
        element={
          <PermissionGuard permission="property-reviews.update">
            <EditPropertyReview />
          </PermissionGuard>
        }
      />

      {/* PROPERTY VISITS */}

      <Route
        path="property-visits"
        element={
          <PermissionGuard permission="property-visits.view">
            <PropertyVisitList />
          </PermissionGuard>
        }
      />

      <Route
        path="property-visits/create"
        element={
          <PermissionGuard permission="property-visits.create">
            <PropertyVisitCreate />
          </PermissionGuard>
        }
      />

      <Route
        path="property-visits/:id"
        element={
          <PermissionGuard permission="property-visits.view">
            <PropertyVisitShow />
          </PermissionGuard>
        }
      />

      {/* PROPERTY FAVORITES */}

      <Route
        path="property-favorites"
        element={
          <PermissionGuard permission="property-favorites.view">
            <PropertyFavoriteList />
          </PermissionGuard>
        }
      />

      <Route
        path="property-favorites/create"
        element={
          <PermissionGuard permission="property-favorites.create">
            <CreatePropertyFavorite />
          </PermissionGuard>
        }
      />

      <Route
        path="property-favorites/edit/:id"
        element={
          <PermissionGuard permission="property-favorites.update">
            <EditPropertyFavorite />
          </PermissionGuard>
        }
      />

      {/* PROPERTY ANALITICS */}
      <Route
        path="property-analytics"
        element={
          <PermissionGuard permission="property-analytics.view">
            <PropertyAnalyticsList />
          </PermissionGuard>
        }
      />

    </>
  );
};

export default SuperAdminRoutes;