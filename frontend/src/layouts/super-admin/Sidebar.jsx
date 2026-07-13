import superAdminSidebar from "../../data/superAdminSidebar";
import SidebarItem from "./SidebarItem";
import SidebarDropdown from "./SidebarDropdown";

import { Zap } from "lucide-react";
import { useDispatch } from "react-redux";
import { logoutUser } from "../../store/authSlice";
import { useNavigate } from "react-router-dom";

const Sidebar = ({ collapsed }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  /*
  |--------------------------------------------------
  | LOGOUT HANDLER
  |--------------------------------------------------
  */
  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap?.();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <aside
      className={`relative h-full flex flex-col bg-white dark:bg-slate-900 border-r
      transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >

      {/* ================= LOGO ================= */}
      <div className="p-4 border-b flex items-center justify-center gap-3">

        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
          <Zap className="w-5 h-5 text-white" />
        </div>

        {!collapsed && (
          <div className="leading-tight">
            <h1 className="font-bold text-gray-800 dark:text-white">
              Super Admin
            </h1>
            <p className="text-xs text-gray-500">
              Estate System
            </p>
          </div>
        )}

      </div>

      {/* ================= MENU ================= */}
      <div className="flex-1 p-4 space-y-2 overflow-y-auto">

        {superAdminSidebar.map((item, index) => {

          /* ---------------- LOGOUT ACTION ---------------- */
          if (item.action === "logout") {
            return (
              <button
                key={index}
                onClick={handleLogout}
                className="flex items-center gap-3 w-full p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              >
                <item.icon className="w-5 h-5" />
                {!collapsed && <span>{item.title}</span>}
              </button>
            );
          }

          /* ---------------- DROPDOWN MENU ---------------- */
          if (item.children) {
            return (
              <SidebarDropdown
                key={index}
                item={item}
                collapsed={collapsed}
              />
            );
          }

          /* ---------------- NORMAL ITEM ---------------- */
          return (
            <SidebarItem
              key={index}
              item={item}
              collapsed={collapsed}
            />
          );
        })}

      </div>

    </aside>
  );
};

export default Sidebar;