import { BrowserRouter } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";

import AppRoutes from "../routes";
import ToastContainer from "../components/common/ToastContainer";

import { hydrateAuth } from "../store/authSlice";

export default function App() {
  const dispatch = useDispatch();

  const notifications = useSelector(
    (state) => state?.ui?.notifications || []
  );

  /*
  |--------------------------------------------------------------------------
  | 🔐 HYDRATE AUTH ON APP START (FIX YOUR REFRESH BUG)
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    dispatch(hydrateAuth());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100 dark:bg-slate-950">

        {/* GLOBAL TOASTS */}
        {notifications.length > 0 && <ToastContainer />}

        {/* ROUTES */}
        <AppRoutes />

      </div>
    </BrowserRouter>
  );
}