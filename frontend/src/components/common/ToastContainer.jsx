import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { removeNotification } from "../../store/uiSlice";

import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

/*
|--------------------------------------------------------------------------
| TOAST COMPONENT
|--------------------------------------------------------------------------
*/
const Toast = ({ id, type, message, duration = 3000, sticky }) => {
  const dispatch = useDispatch();

  /*
  |--------------------------------------------------------------------------
  | AUTO REMOVE (skip sticky notifications)
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    if (!duration || sticky) return;

    const timer = setTimeout(() => {
      dispatch(removeNotification(id));
    }, duration);

    return () => clearTimeout(timer);
  }, [dispatch, id, duration, sticky]);

  /*
  |--------------------------------------------------------------------------
  | ICONS
  |--------------------------------------------------------------------------
  */
  const icons = {
    success: <CheckCircleIcon className="w-6 h-6 text-green-500" />,
    error: <ExclamationCircleIcon className="w-6 h-6 text-red-500" />,
    info: <InformationCircleIcon className="w-6 h-6 text-blue-500" />,
    warning: <ExclamationTriangleIcon className="w-6 h-6 text-amber-500" />,
  };

  /*
  |--------------------------------------------------------------------------
  | STYLES
  |--------------------------------------------------------------------------
  */
  const styles = {
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200",
    info: "bg-blue-50 border-blue-200",
    warning: "bg-amber-50 border-amber-200",
  };

  return (
    <div
      className={`
        flex items-start w-80 p-4 mb-3 rounded-lg border shadow-lg
        transform transition-all duration-300 animate-slide-in-right
        ${styles[type] || styles.info}
      `}
    >
      {/* ICON */}
      <div className="flex-shrink-0 mr-3">
        {icons[type] || icons.info}
      </div>

      {/* MESSAGE */}
      <div className="flex-1 pt-0.5">
        <p className="text-sm font-medium text-gray-900 leading-snug">
          {message}
        </p>

        {/* CRITICAL BADGE */}
        {sticky && (
          <span className="text-xs text-red-500 font-medium">
            Important
          </span>
        )}
      </div>

      {/* CLOSE BUTTON */}
      <button
        onClick={() => dispatch(removeNotification(id))}
        className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600"
      >
        <XMarkIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| TOAST CONTAINER
|--------------------------------------------------------------------------
*/
const ToastContainer = () => {
  const notifications = useSelector((state) => state.ui.notifications);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end space-y-2 pointer-events-none">
      <div className="pointer-events-auto">
        {notifications.map((notification) => (
          <Toast key={notification.id} {...notification} />
        ))}
      </div>
    </div>
  );
};

export default ToastContainer;