import { Routes, Route, Navigate } from "react-router-dom";

/*
|--------------------------------------------------------------------------
| GUARDS
|--------------------------------------------------------------------------
*/
import AuthGuard from "../auth/guards/AuthGuard";
import RoleGuard from "../auth/guards/RoleGuard";

/*
|--------------------------------------------------------------------------
| LAYOUTS
|--------------------------------------------------------------------------
*/
import AdminLayout from "../layouts/AdminLayout";
import SuperAdminLayout from "../layouts/SuperAdminLayout";
import LandlordLayout from "../layouts/LandlordLayout";
import AgentLayout from "../layouts/AgentLayout";
import TenantLayout from "../layouts/TenantLayout";

/*
|--------------------------------------------------------------------------
| PLACEHOLDER PAGES
|--------------------------------------------------------------------------
*/
const Dashboard = () => <h1>Dashboard</h1>;
const Users = () => <h1>Users</h1>;
const Properties = () => <h1>Properties</h1>;
const Tenants = () => <h1>Tenants</h1>;
const Payments = () => <h1>Payments</h1>;
const Profile = () => <h1>Profile</h1>;
const Roles = () => <h1>Roles</h1>;
const Permissions = () => <h1>Permissions</h1>;
const Settings = () => <h1>Settings</h1>;
const NotFound = () => <h1>404 - Not Found</h1>;

export default function ProtectedRoutes() {
  return (
    <Routes>

      {/* =========================================================
          🟣 SUPER ADMIN
      ========================================================= */}
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
        <Route index element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="roles" element={<Roles />} />
        <Route path="permissions" element={<Permissions />} />
        <Route path="properties" element={<Properties />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* =========================================================
          🔵 ADMIN (NO NEED TO INCLUDE SUPER-ADMIN)
          super-admin already bypasses in RoleGuard
      ========================================================= */}
      <Route
        path="/admin/*"
        element={
          <AuthGuard>
            <RoleGuard roles={["admin"]}>
              <AdminLayout />
            </RoleGuard>
          </AuthGuard>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="properties" element={<Properties />} />
        <Route path="tenants" element={<Tenants />} />
        <Route path="payments" element={<Payments />} />
      </Route>

      {/* =========================================================
          🟢 LANDLORD
      ========================================================= */}
      <Route
        path="/landlord/*"
        element={
          <AuthGuard>
            <RoleGuard roles={["landlord"]}>
              <LandlordLayout />
            </RoleGuard>
          </AuthGuard>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="properties" element={<Properties />} />
        <Route path="tenants" element={<Tenants />} />
        <Route path="payments" element={<Payments />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* =========================================================
          🟡 AGENT
      ========================================================= */}
      <Route
        path="/agent/*"
        element={
          <AuthGuard>
            <RoleGuard roles={["agent"]}>
              <AgentLayout />
            </RoleGuard>
          </AuthGuard>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="properties" element={<Properties />} />
        <Route path="tenants" element={<Tenants />} />
        <Route path="payments" element={<Payments />} />
      </Route>

      {/* =========================================================
          🔴 TENANT
      ========================================================= */}
      <Route
        path="/tenant/*"
        element={
          <AuthGuard>
            <RoleGuard roles={["tenant"]}>
              <TenantLayout />
            </RoleGuard>
          </AuthGuard>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="payments" element={<Payments />} />
      </Route>

      {/* =========================================================
          ❌ FALLBACK
      ========================================================= */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFound />} />

    </Routes>
  );
}