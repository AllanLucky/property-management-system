import AuthGuard from "../auth/guards/AuthGuard";
import RoleGuard from "../auth/guards/RoleGuard";

// Layouts
import SuperAdminLayout from "../layouts/SuperAdminLayout";
import AdminLayout from "../layouts/AdminLayout";
import LandlordLayout from "../layouts/LandlordLayout";
import AgentLayout from "../layouts/AgentLayout";
import TenantLayout from "../layouts/TenantLayout";

// ==========================
// ROLE ROUTE CONFIGURATION
// ==========================

const roleRoutes = [
  {
    path: "/super-admin",
    element: (
      <AuthGuard>
        <RoleGuard roles={["super-admin"]}>
          <SuperAdminLayout />
        </RoleGuard>
      </AuthGuard>
    ),
  },

  {
    path: "/admin",
    element: (
      <AuthGuard>
        <RoleGuard roles={["admin", "super-admin"]}>
          <AdminLayout />
        </RoleGuard>
      </AuthGuard>
    ),
  },

  {
    path: "/landlord",
    element: (
      <AuthGuard>
        <RoleGuard roles={["landlord"]}>
          <LandlordLayout />
        </RoleGuard>
      </AuthGuard>
    ),
  },

  {
    path: "/agent",
    element: (
      <AuthGuard>
        <RoleGuard roles={["agent"]}>
          <AgentLayout />
        </RoleGuard>
      </AuthGuard>
    ),
  },

  {
    path: "/tenant",
    element: (
      <AuthGuard>
        <RoleGuard roles={["tenant"]}>
          <TenantLayout />
        </RoleGuard>
      </AuthGuard>
    ),
  },
];

export default roleRoutes;