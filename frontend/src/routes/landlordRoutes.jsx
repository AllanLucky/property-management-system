import { Route } from "react-router-dom";

import AuthGuard from "../auth/guards/AuthGuard";
import RoleGuard from "../auth/guards/RoleGuard";

import LandlordLayout from "../layouts/LandlordLayout";

const Dashboard = () => <h1>Landlord Dashboard</h1>;
const Properties = () => <h1>My Properties</h1>;
const Tenants = () => <h1>My Tenants</h1>;

const LandlordRoutes = (
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
  </Route>
);

export default LandlordRoutes;