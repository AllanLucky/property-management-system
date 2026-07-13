import { Route } from "react-router-dom";

import AuthGuard from "../auth/guards/AuthGuard";
import RoleGuard from "../auth/guards/RoleGuard";

import AdminLayout from "../layouts/AdminLayout";

const Dashboard = () => <h1>Admin Dashboard</h1>;
const Users = () => <h1>Users</h1>;
const Properties = () => <h1>Properties</h1>;
const Tenants = () => <h1>Tenants</h1>;
const Payments = () => <h1>Payments</h1>;

const AdminRoutes = (
  <Route
    path="/admin/*"
    element={
      <AuthGuard>
        <RoleGuard roles={["admin", "super-admin"]}>
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
);

export default AdminRoutes;