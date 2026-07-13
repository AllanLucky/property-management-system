import { Route } from "react-router-dom";

import AuthGuard from "../auth/guards/AuthGuard";
import RoleGuard from "../auth/guards/RoleGuard";

import AgentLayout from "../layouts/AgentLayout";

const Dashboard = () => <h1>Agent Dashboard</h1>;
const Listings = () => <h1>Listings</h1>;
const Leads = () => <h1>Leads</h1>;

const AgentRoutes = (
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
    <Route path="listings" element={<Listings />} />
    <Route path="leads" element={<Leads />} />
  </Route>
);

export default AgentRoutes;