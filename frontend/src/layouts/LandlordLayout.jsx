import { useState } from "react";
import { Outlet } from "react-router-dom";
import LandlordHeader from "../components/headers/LandlordHeader";
import LandlordSidebar from "../components/sidebar/LandlordSidebar";

const LandlordLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">

      {/* Sidebar */}
      <aside
        className={`bg-white border-r transition-all duration-300
        ${collapsed ? "w-20" : "w-64"}`}
      >
        <LandlordHeader collapsed={collapsed} />
      </aside>

      {/* Main area */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Navbar */}
        <LandlordSidebar toggleSidebar={() => setCollapsed(!collapsed)} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default LandlordLayout;