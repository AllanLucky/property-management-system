// import { NavLink } from "react-router-dom";
// import { useSelector } from "react-redux";

// import {
//   LayoutDashboard,
//   Building2,
//   Users,
//   UserCog,
//   ShieldCheck,
//   KeyRound,
//   Settings,
//   Zap,
//   Briefcase,
//   CreditCard,
//   FileText,
//   Activity,
//   FolderOpen,
//   Wrench,
//   Bell,
//   ClipboardList,
//   MessageCircle,
//   Megaphone,
//   Mic,
//   Map,
//   LandPlot,
//   Receipt,
//   BarChart3,
//   ClipboardCheck,
// } from "lucide-react";

// import allan from "../../assets/images/allan.jpg";

// /*
// |--------------------------------------------------------------------------
// | MENU CONFIG
// |--------------------------------------------------------------------------
// */
// const menuItems = [
//   {
//     section: "Main",
//     items: [
//       { label: "Dashboard", icon: LayoutDashboard, path: "dashboard" },
//     ],
//   },

//   {
//     section: "Property",
//     items: [
//       { label: "Properties", icon: Building2, path: "properties" },
//       { label: "Units", icon: Building2, path: "units" },
//       { label: "Leases", icon: ClipboardList, path: "leases" },
//     ],
//   },

//   {
//     section: "People",
//     items: [
//       { label: "Tenants", icon: Users, path: "tenants" },
//       { label: "Landlords", icon: UserCog, path: "landlords" },
//       { label: "Agents", icon: Briefcase, path: "agents" },
//       { label: "Employees", icon: UserCog, path: "employees" },
//     ],
//   },

//   {
//     section: "Finance",
//     items: [
//       { label: "Payments", icon: CreditCard, path: "payments" },
//       { label: "Invoices", icon: FileText, path: "invoices" },
//       { label: "Expenses", icon: Activity, path: "expenses" },
//       { label: "Expense Categories", icon: ClipboardCheck, path: "expense-categories" },
//       { label: "Reports", icon: BarChart3, path: "finance-reports" },
//     ],
//   },

//   {
//     section: "Operations",
//     items: [
//       { label: "Maintenance", icon: Wrench, path: "maintenance" },
//       { label: "Notifications", icon: Bell, path: "notifications" },
//     ],
//   },

//   {
//     section: "Communication",
//     items: [
//       { label: "Chat", icon: MessageCircle, path: "chat" },
//       { label: "Campaigns", icon: Megaphone, path: "campaigns" },
//       { label: "Announcements", icon: Mic, path: "announcements" },
//     ],
//   },

//   {
//     section: "Land System",
//     items: [
//       { label: "Plots", icon: Map, path: "plots" },
//       { label: "Plot Sales", icon: LandPlot, path: "plot-sales" },
//       { label: "Plot Payments", icon: Receipt, path: "plot-payments" },
//     ],
//   },

//   {
//     section: "Documents",
//     items: [
//       { label: "Documents", icon: FolderOpen, path: "documents" },
//     ],
//   },

//   {
//     section: "Administration",
//     items: [
//       { label: "Users", icon: Users, path: "users" },
//       { label: "Roles", icon: ShieldCheck, path: "roles" },
//       { label: "Permissions", icon: KeyRound, path: "permissions" },
//       { label: "Settings", icon: Settings, path: "settings" },
//     ],
//   },
// ];

// /*
// |--------------------------------------------------------------------------
// | SIDEBAR COMPONENT
// |--------------------------------------------------------------------------
// */
// function SuperAdminSidebar({ collapsed }) {
//   const user = useSelector((state) => state.auth?.user);
//   const notifications = useSelector((state) => state.ui?.notifications || []);

//   const unreadCount = notifications.length;

//   const userName =
//     user?.first_name && user?.last_name
//       ? `${user.first_name} ${user.last_name}`
//       : user?.name || "User";

//   const role =
//     Array.isArray(user?.roles)
//       ? (user.roles[0]?.name || user.roles[0] || "Member")
//       : "Member";

//   return (
//     <div
//       className={`relative h-full flex flex-col bg-white dark:bg-slate-900 border-r
//       transition-all duration-300 ${collapsed ? "w-20" : "w-64"}`}
//     >
//       {/* LOGO */}
//       <div className="p-4 border-b flex items-center justify-center gap-3">
//         <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
//           <Zap className="w-5 h-5 text-white" />
//         </div>

//         {!collapsed && (
//           <div>
//             <h1 className="font-bold text-gray-800 dark:text-white">
//               Super Admin
//             </h1>
//             <p className="text-xs text-gray-500">Estate System</p>
//           </div>
//         )}
//       </div>

//       {/* NAVIGATION */}
//       <nav className="flex-1 overflow-y-auto p-2 space-y-5">
//         {menuItems.map((section) => (
//           <div key={section.section}>
//             {!collapsed && (
//               <p className="text-xs uppercase text-gray-400 px-2 mb-2">
//                 {section.section}
//               </p>
//             )}

//             <div className="space-y-1">
//               {section.items.map((item) => {
//                 const Icon = item.icon;

//                 return (
//                   <NavLink
//                     key={item.path}
//                     to={`/super-admin/${item.path}`}
//                     className={({ isActive }) =>
//                       `flex items-center gap-3 px-3 py-2 rounded-lg transition
//                       ${
//                         isActive
//                           ? "bg-blue-600 text-white"
//                           : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
//                       }
//                       ${collapsed ? "justify-center" : ""}`
//                     }
//                   >
//                     <Icon className="w-5 h-5" />
//                     {!collapsed && (
//                       <span className="text-sm">{item.label}</span>
//                     )}
//                   </NavLink>
//                 );
//               })}
//             </div>
//           </div>
//         ))}
//       </nav>

//       {/* USER PROFILE */}
//       <div className="p-4 border-t">
//         <div
//           className={`flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800 ${
//             collapsed ? "justify-center" : ""
//           }`}
//         >
//           <img
//             src={user?.image || allan}
//             alt="User"
//             className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500"
//           />

//           {!collapsed && (
//             <div>
//               <p className="text-sm font-medium text-gray-800 dark:text-white">
//                 {userName}
//               </p>
//               <p className="text-xs text-gray-500">{role}</p>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* NOTIFICATION BADGE */}
//       {!collapsed && unreadCount > 0 && (
//         <div className="absolute bottom-4 right-4 bg-red-600 text-white text-xs px-3 py-1 rounded-full shadow-lg flex items-center gap-2">
//           <Bell className="w-4 h-4" />
//           {unreadCount} Notifications
//         </div>
//       )}
//     </div>
//   );
// }

// export default SuperAdminSidebar;