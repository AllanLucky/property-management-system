import { Routes, Route, Navigate } from "react-router-dom";

/*
|--------------------------------------------------------------------------
| LAYOUTS
|--------------------------------------------------------------------------
*/
import AuthLayout from "../layouts/AuthLayout";
import AdminLayout from "../layouts/AdminLayout";
import SuperAdminLayout from "../layouts/super-admin/SuperAdminLayout";
import LandlordLayout from "../layouts/LandlordLayout";
import AgentLayout from "../layouts/AgentLayout";
import TenantLayout from "../layouts/TenantLayout";

/*
|--------------------------------------------------------------------------
| AUTH PAGES
|--------------------------------------------------------------------------
*/
import Login from "../auth/pages/Login";
import Register from "../auth/pages/Register";
import ForgotPassword from "../auth/pages/ForgotPassword";
import ResetPassword from "../auth/pages/ResetPassword";
import VerifyOTP from "../auth/pages/VerifyOTP";

/*
|--------------------------------------------------------------------------
| GUARDS
|--------------------------------------------------------------------------
*/
import AuthGuard from "../auth/guards/AuthGuard";
import RoleGuard from "../auth/guards/RoleGuard";

/*
|--------------------------------------------------------------------------
| ROUTE GROUPS
|--------------------------------------------------------------------------
*/
import SuperAdminRoutes from "./SuperAdminRoutes";
// import AdminRoutes from "./AdminRoutes";
// import LandlordRoutes from "./LandlordRoutes";
// import AgentRoutes from "./AgentRoutes";
// import TenantRoutes from "./TenantRoutes";

/*
|--------------------------------------------------------------------------
| FALLBACK PAGES
|--------------------------------------------------------------------------
*/
const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center">
    <h1 className="text-3xl font-bold text-red-600">
      404 - Page Not Found
    </h1>
  </div>
);

const Unauthorized = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="bg-white shadow-xl rounded-2xl p-10 text-center max-w-md w-full">
      <div className="text-6xl mb-4">🚫</div>

      <h1 className="text-3xl font-bold text-red-600">
        403 - Unauthorized
      </h1>

      <p className="text-gray-600 mt-3">
        You do not have permission to access this page.
      </p>
    </div>
  </div>
);

/*
|--------------------------------------------------------------------------
| ROLE REDIRECT
|--------------------------------------------------------------------------
*/
const RoleRedirect = () => {
  const user = JSON.parse(
    localStorage.getItem("auth_user") || "null"
  );

  const roleNames = (user?.roles || []).map((role) =>
    typeof role === "string"
      ? role
      : role?.name
  );

  if (roleNames.includes("super-admin")) {
    return <Navigate to="/super-admin/dashboard" replace />;
  }

  if (roleNames.includes("admin")) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (roleNames.includes("landlord")) {
    return <Navigate to="/landlord/dashboard" replace />;
  }

  if (roleNames.includes("agent")) {
    return <Navigate to="/agent/dashboard" replace />;
  }

  if (roleNames.includes("tenant")) {
    return <Navigate to="/tenant/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
};

/*
|--------------------------------------------------------------------------
| APP ROUTES
|--------------------------------------------------------------------------
*/
export default function AppRoutes() {
  return (
    <Routes>
      {/* AUTH */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
      </Route>

      {/* ROOT */}
      <Route path="/" element={<RoleRedirect />} />

      {/* SUPER ADMIN */}
      <Route
        path="/super-admin/*"
        element={
          <AuthGuard>
            <RoleGuard roles={["super-admin"]}>
              <SuperAdminLayout />
            </RoleGuard>
          </AuthGuard>
        }
      >
        {SuperAdminRoutes()}
      </Route>

      {/* ADMIN */}
      {/* <Route
        path="/admin/*"
        element={
          <AuthGuard>
            <RoleGuard roles={["admin"]}>
              <AdminLayout />
            </RoleGuard>
          </AuthGuard>
        }
      >
        {AdminRoutes()}
      </Route> */}

      {/* LANDLORD */}
      {/* <Route
        path="/landlord/*"
        element={
          <AuthGuard>
            <RoleGuard roles={["landlord"]}>
              <LandlordLayout />
            </RoleGuard>
          </AuthGuard>
        }
      >
        {LandlordRoutes()}
      </Route> */}

      {/* AGENT */}
      {/* <Route
        path="/agent/*"
        element={
          <AuthGuard>
            <RoleGuard roles={["agent"]}>
              <AgentLayout />
            </RoleGuard>
          </AuthGuard>
        }
      >
        {AgentRoutes()}
      </Route> */}

      {/* TENANT */}
      {/* <Route
        path="/tenant/*"
        element={
          <AuthGuard>
            <RoleGuard roles={["tenant"]}>
              <TenantLayout />
            </RoleGuard>
          </AuthGuard>
        }
      >
        {TenantRoutes()}
      </Route> */}

      {/* SYSTEM */}
      <Route
        path="/unauthorized"
        element={<Unauthorized />}
      />

      <Route
        path="*"
        element={<NotFound />}
      />
    </Routes>
  );
}