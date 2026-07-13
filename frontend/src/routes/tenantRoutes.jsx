import { Route } from "react-router-dom";

import AuthGuard from "../auth/guards/AuthGuard";
import RoleGuard from "../auth/guards/RoleGuard";

import TenantLayout from "../layouts/TenantLayout";

const Dashboard = () => <h1>Tenant Dashboard</h1>;
const Profile = () => <h1>Profile</h1>;
const Payments = () => <h1>Payments</h1>;
const Rentals = () => <h1>My Rentals</h1>;

const TenantRoutes = (
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
    <Route path="rentals" element={<Rentals />} />
  </Route>
);

export default TenantRoutes;