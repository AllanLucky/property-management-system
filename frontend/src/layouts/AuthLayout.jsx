import { Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">

      {/* AUTH CONTAINER */}
      <div className="w-full max-w-md p-6">

        {/* CARD */}
        <div className="bg-white dark:bg-slate-900 shadow-xl rounded-2xl border border-slate-200 dark:border-slate-700 p-6">

          {/* OPTIONAL LOGO AREA */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Real Estate System
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Sign in to continue
            </p>
          </div>

          {/* AUTH PAGES RENDER HERE */}
          <Outlet />

        </div>

        {/* FOOTER */}
        <p className="text-center text-xs text-slate-500 mt-6">
          © {new Date().getFullYear()} Your Company. All rights reserved.
        </p>

      </div>
    </div>
  );
};

export default AuthLayout;