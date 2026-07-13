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

import {
  useState,
  useRef,
  useEffect,
  useMemo,
} from "react";

import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../../store/authSlice";
import { useNavigate } from "react-router-dom";

import defaultAvatar from "../../assets/images/allan.jpg";

const Topbar = ({
  toggleSidebar,
  toggleTheme,
  theme,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | AUTH USER
  |--------------------------------------------------------------------------
  */
  const user = useSelector(
    (state) => state.auth?.user
  );

  /*
  |--------------------------------------------------------------------------
  | LOCAL STATE
  |--------------------------------------------------------------------------
  */
  const [dropdownOpen, setDropdownOpen] =
    useState(false);

  const dropdownRef = useRef(null);

  /*
  |--------------------------------------------------------------------------
  | USER NAME
  |--------------------------------------------------------------------------
  */
  const userName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.name || "User";

  /*
  |--------------------------------------------------------------------------
  | USER AVATAR
  |--------------------------------------------------------------------------
  */
  const avatar = useMemo(() => {
    const image =
      user?.image_url ||
      user?.image ||
      user?.avatar ||
      user?.profile_image ||
      user?.photo_url;

    if (!image) {
      return defaultAvatar;
    }

    // Prevent browser cache after avatar changes
    return `${image}${
      image.includes("?") ? "&" : "?"
    }v=${user?.updated_at || Date.now()}`;
  }, [user]);

  /*
  |--------------------------------------------------------------------------
  | THEME
  |--------------------------------------------------------------------------
  */
  const isDark = theme === "dark";

  /*
  |--------------------------------------------------------------------------
  | DEBUG (REMOVE AFTER TESTING)
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    console.log("TOPBAR USER:", user);
    console.log("TOPBAR AVATAR:", avatar);
  }, [user, avatar]);

  /*
  |--------------------------------------------------------------------------
  | CLOSE DROPDOWN
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */
  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();

      navigate("/login");
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | PROFILE
  |--------------------------------------------------------------------------
  */
  const goToProfile = () => {
    setDropdownOpen(false);
    navigate("/super-admin/profile");
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200/50 dark:border-slate-700/50 px-4 py-3 shadow-sm transition-colors duration-300">
      <div className="flex items-center justify-between">

        {/* LEFT */}
        <div className="flex items-center gap-4">

          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Menu />
          </button>

          <div className="hidden md:block">
            <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Dashboard
            </h1>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Welcome back, {userName}
            </p>
          </div>

        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">

          <button className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition">
            <Plus className="w-4 h-4" />

            <span className="text-sm font-medium">
              New
            </span>
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

          {/* USER MENU */}
          <div
            className="relative"
            ref={dropdownRef}
          >
            <button
              onClick={() =>
                setDropdownOpen(!dropdownOpen)
              }
              className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-700"
            >
              <img
                key={avatar}
                src={avatar}
                alt={userName}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500"
                loading="eager"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  console.error(
                    "Avatar failed:",
                    avatar
                  );

                  e.currentTarget.src =
                    defaultAvatar;
                }}
              />

              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {userName}
                </p>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user?.email || "Online"}
                </p>
              </div>

              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">

                <button
                  onClick={goToProfile}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <User className="w-4 h-4" />
                  Profile
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>

              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Topbar;