import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";

import {
  LayoutDashboard,
  Building2,
  Building,
  Users,
  UserCheck,
  Briefcase,
  CreditCard,
  Wrench,
  FileText,
  BarChart3,
  Settings,
  ShieldCheck,
  MessageSquare,
  Receipt,
  Bell,
  Calendar,
  ClipboardList,
  Banknote,
  FolderOpen,
  Activity,
  Zap,
  KeyRound,
  UserCog,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| MENU CONFIG
|--------------------------------------------------------------------------
*/
const menuItems = [
  {
    section: "Main",
    items: [{ id: "dashboard", icon: LayoutDashboard, label: "Dashboard" }],
  },
  {
    section: "Property Management",
    items: [
      { id: "properties", icon: Building2, label: "Properties" },
      { id: "units", icon: Building, label: "Units / Houses" },
      { id: "leases", icon: ClipboardList, label: "Leases" },
    ],
  },
  {
    section: "People",
    items: [
      { id: "tenants", icon: Users, label: "Tenants" },
      { id: "landlords", icon: UserCheck, label: "Landlords" },
      { id: "agents", icon: Briefcase, label: "Agents" },
      { id: "employees", icon: UserCog, label: "Employees" },
    ],
  },
  {
    section: "Communication",
    items: [
      { id: "inquiries", icon: MessageSquare, label: "Inquiries" },
      { id: "notices", icon: Bell, label: "Notices" },
      { id: "notifications", icon: Activity, label: "Notifications" },
    ],
  },
  {
    section: "Finance",
    items: [
      { id: "payments", icon: CreditCard, label: "Payments" },
      { id: "invoices", icon: FileText, label: "Invoices" },
      { id: "bills", icon: Receipt, label: "Utility Bills" },
      { id: "expenses", icon: Banknote, label: "Expenses" },
    ],
  },
  {
    section: "Operations",
    items: [
      { id: "maintenance", icon: Wrench, label: "Maintenance" },
      { id: "calendar", icon: Calendar, label: "Calendar" },
    ],
  },
  {
    section: "Documents",
    items: [{ id: "documents", icon: FolderOpen, label: "Documents" }],
  },
  {
    section: "Reports",
    items: [
      { id: "reports", icon: BarChart3, label: "Reports" },
      { id: "analytics", icon: Activity, label: "Analytics" },
    ],
  },
  {
    section: "Administration",
    items: [
      { id: "users", icon: Users, label: "Users" },
      { id: "roles", icon: ShieldCheck, label: "Roles" },
      { id: "permissions", icon: KeyRound, label: "Permissions" },
      { id: "settings", icon: Settings, label: "Settings" },
    ],
  },
];

/*
|--------------------------------------------------------------------------
| SIDEBAR COMPONENT
|--------------------------------------------------------------------------
*/
function AgentSidebar({ collapsed }) {
  const { user } = useSelector((state) => state.auth);

  // ✅ dynamic user name
  const userName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.name || "User";

  const role =
    user?.roles?.[0]?.name ||
    user?.roles?.[0] ||
    "Member";

  return (
    <div
      className={`transition-all duration-300 ease-in-out bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-700/50 flex flex-col h-full
      ${collapsed ? "w-20" : "w-64"}`}
    >

      {/* LOGO */}
      <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center space-x-3 justify-center">

          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>

          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                Super Admin
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Real Estate System
              </p>
            </div>
          )}

        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 p-2 space-y-6 overflow-y-auto">
        {menuItems.map((section) => (
          <div key={section.section}>
            {!collapsed && (
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2 px-2">
                {section.section}
              </p>
            )}

            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.id}
                    to={`/super-admin/${item.id}`}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-3 py-2 rounded-lg transition
                      ${
                        isActive
                          ? "bg-blue-500 text-white shadow-md"
                          : "text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-slate-800"
                      }
                      ${collapsed ? "justify-center" : ""}`
                    }
                  >
                    <Icon className="w-5 h-5" />

                    {!collapsed && (
                      <span className="text-sm">{item.label}</span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* USER PROFILE */}
      <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/50">

        <div className={`flex items-center space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800
          ${collapsed ? "justify-center" : ""}`}>

          <img
            src={user?.image || "/allan.jpg"}
            alt="User"
            className="w-10 h-10 rounded-full ring-1 ring-blue-500"
          />

          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-white">
                {userName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {role}
              </p>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}

export default AgentSidebar;