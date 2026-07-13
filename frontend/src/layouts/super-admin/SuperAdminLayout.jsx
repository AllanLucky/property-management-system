import { useState } from "react";
import { Outlet } from "react-router-dom";

import Topbar from "../../layouts/super-admin/Topbar";
import Sidebar from "../../layouts/super-admin/Sidebar";

const SuperAdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">

      {/* SIDEBAR */}
      <aside
        className={`
          bg-white border-r shadow-sm transition-all duration-300
          ${collapsed ? "w-20" : "w-64"}
        `}
      >
        <Sidebar collapsed={collapsed} />
      </aside>

      {/* MAIN WRAPPER */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* HEADER */}
        <Topbar
          toggleSidebar={() => setCollapsed((prev) => !prev)}
        />

        {/* CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default SuperAdminLayout;