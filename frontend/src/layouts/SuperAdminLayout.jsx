// import { useState } from "react";
// import { Outlet } from "react-router-dom";

// import SuperAdminHeader from "../components/headers/SuperAdminHeader";
// import SuperAdminSidebar from "../components/sidebar/SuperAdminSidebar";

// const SuperAdminLayout = () => {
//   const [collapsed, setCollapsed] = useState(false);

//   return (
//     <div className="flex h-screen bg-gray-50">

//       {/* SIDEBAR */}
//       <aside
//         className={`
//           bg-white border-r shadow-sm transition-all duration-300
//           ${collapsed ? "w-20" : "w-64"}
//         `}
//       >
//         <SuperAdminSidebar collapsed={collapsed} />
//       </aside>

//       {/* MAIN WRAPPER */}
//       <div className="flex flex-col flex-1 overflow-hidden">

//         {/* HEADER */}
//         <SuperAdminHeader
//           toggleSidebar={() => setCollapsed((prev) => !prev)}
//         />

//         {/* CONTENT AREA */}
//         <main className="flex-1 overflow-y-auto p-6">
//           <Outlet />
//         </main>

//       </div>
//     </div>
//   );
// };

// export default SuperAdminLayout;