import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

import {
  Users,
  UserCheck,
  Wrench,
  Activity,
  ShieldCheck,
  Bell,
  BarChart3,
} from "lucide-react";

const Dashboard = () => {
  const user = useSelector((state) => state.auth?.user);

  const userName =
    user?.name ||
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "User";

  return (
    <div className="space-y-6">

      {/* ================= HEADER ================= */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Welcome back, {userName} 👋
          </h1>

          <p className="text-gray-500 dark:text-gray-400">
            Here’s an overview of your property operations today.
          </p>
        </div>

        <div className="mt-3 md:mt-0 text-sm text-gray-500 dark:text-gray-400">
          System Status:{" "}
          <span className="text-green-500 font-medium">
            Operational
          </span>
        </div>

      </header>

      {/* ================= STATS ================= */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow">
          <div className="flex items-center gap-2 text-gray-500">
            <Users className="w-4 h-4" />
            <p className="text-sm">Total Users</p>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            120
          </h2>
          <span className="text-xs text-green-500">+12% this week</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow">
          <div className="flex items-center gap-2 text-gray-500">
            <UserCheck className="w-4 h-4" />
            <p className="text-sm">Active Agents</p>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            25
          </h2>
          <span className="text-xs text-green-500">+5 new today</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow">
          <div className="flex items-center gap-2 text-gray-500">
            <Wrench className="w-4 h-4" />
            <p className="text-sm">Maintenance Requests</p>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            8
          </h2>
          <span className="text-xs text-red-500">2 pending</span>
        </div>

      </section>

      {/* ================= INSIGHTS ================= */}
      <section className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow">

        <h2 className="font-semibold mb-3 text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          System Insights
        </h2>

        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
          <li>• 3 new users registered today</li>
          <li>• 2 maintenance requests need attention</li>
          <li>• All services are running normally</li>
        </ul>

      </section>

      {/* ================= MAIN GRID ================= */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* RECENT ACTIVITY */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow">

          <h2 className="font-semibold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Recent Activity
          </h2>

          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <p>• {userName} created a new user</p>
            <p>• Agent John updated a property listing</p>
            <p>• Payment received from Tenant A</p>
            <p>• Maintenance request marked as completed</p>
          </div>

        </div>

        {/* ANALYTICS */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow">

          <h2 className="font-semibold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Quick Analytics
          </h2>

          <div className="space-y-4">

            <div>
              <p className="text-sm text-gray-500">Revenue</p>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                $12,450
              </h3>
            </div>

            <div>
              <p className="text-sm text-gray-500">Occupancy Rate</p>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                85%
              </h3>
            </div>

            <div>
              <p className="text-sm text-gray-500">New Tenants</p>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                6 this week
              </h3>
            </div>

          </div>

        </div>

      </section>

      {/* ================= QUICK ACTIONS ================= */}
      <section className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow">

        <h2 className="font-semibold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          Quick Actions
        </h2>

        <div className="flex flex-wrap gap-3">

          <Link to="/super-admin/users/create">
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition">
              + Create User
            </button>
          </Link>

          <Link to="/super-admin/roles">
            <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition">
              Manage Roles
            </button>
          </Link>

          <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition">
            View Reports
          </button>

        </div>

      </section>

      {/* ================= TIP ================= */}
      <section className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl">

        <p className="text-sm text-indigo-700 dark:text-indigo-300">
          💡 Tip: Keep your system updated regularly to ensure accurate reporting and analytics.
        </p>

      </section>

    </div>
  );
};

export default Dashboard;