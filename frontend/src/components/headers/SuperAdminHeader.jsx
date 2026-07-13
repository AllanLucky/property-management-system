import {
  Menu,
  Plus,
  Sun,
  Moon,
  Bell,
  ChevronDown,
  User,
  LogOut,
} from "lucide-react";

import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../../store/authSlice";
import { useNavigate } from "react-router-dom";

// ✅ IMPORT LOCAL IMAGE (VITE WAY)
import allan from "../../assets/images/allan.jpg";

const SuperAdminHeader = ({ toggleSidebar, toggleTheme, theme }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth?.user);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  /*
  |--------------------------------------------------
  | OUTSIDE CLICK CLOSE
  |--------------------------------------------------
  */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /*
  |--------------------------------------------------
  | LOGOUT
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

  const isDark = theme === "dark";

  /*
  |--------------------------------------------------
  | USER NAME
  |--------------------------------------------------
  */
  const userName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.name || "User";

  /*
  |--------------------------------------------------
  | PROFILE IMAGE (FIXED)
  |--------------------------------------------------
  */
  const profileImage = user?.image ? user.image : allan;

  return (
    <header className="bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200/50 dark:border-slate-700/50 p-4 transition-colors duration-300">

      <div className="flex items-center justify-between">

        {/* LEFT */}
        <div className="flex items-center space-x-4">

          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Menu />
          </button>

          <div className="hidden md:block">
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Welcome back, {userName}
            </p>
          </div>

        </div>

        {/* RIGHT */}
        <div className="flex items-center space-x-3">

          <button className="hidden lg:flex items-center space-x-2 py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition">
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">New</span>
          </button>

          {/* THEME */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* NOTIFICATIONS */}
          <button className="relative p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
              5
            </span>
          </button>

          {/* USER */}
          <div className="relative" ref={dropdownRef}>

            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-3 pl-3 border-l border-slate-200 dark:border-slate-700"
            >

              {/* ✅ FIXED IMAGE */}
              <img
                src={profileImage}
                alt="user"
                className="w-8 h-8 rounded-full ring-2 ring-blue-500 object-cover"
              />

              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {userName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user?.email || "Online"}
                </p>
              </div>

              <ChevronDown className="w-4 h-4 text-slate-400" />

            </button>

            {/* DROPDOWN */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-slate-800 shadow-lg rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">

                <button className="flex items-center space-x-2 w-full px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 w-full px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>

              </div>
            )}

          </div>

        </div>
      </div>

    </header>
  );
};

export default SuperAdminHeader;