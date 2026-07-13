import { createSlice, nanoid } from "@reduxjs/toolkit";

const initialState = {
  sidebarOpen: true,

  notifications: [],
};

/*
|--------------------------------------------------------------------------
| HELPER: detect critical messages
|--------------------------------------------------------------------------
*/
const isCritical = (message = "") => {
  const msg = message.toLowerCase();

  return (
    msg.includes("suspended") ||
    msg.includes("banned") ||
    msg.includes("forbidden") ||
    msg.includes("unauthorized")
  );
};

/*
|--------------------------------------------------------------------------
| SLICE
|--------------------------------------------------------------------------
*/
const uiSlice = createSlice({
  name: "ui",
  initialState,

  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },

    /*
    |--------------------------------------------------------------------------
    | ADD NOTIFICATION (IMPROVED)
    |--------------------------------------------------------------------------
    */
    addNotification: {
      reducer: (state, action) => {
        const n = action.payload;
        const now = Date.now();

        const critical = n.priority === "critical" || n.sticky || isCritical(n.message);

        // 🔥 Only block duplicates for NON-critical messages
        if (!critical) {
          const isDuplicate = state.notifications.some(
            (item) =>
              item.message === n.message &&
              item.type === n.type &&
              now - item.createdAt < 2000
          );

          if (isDuplicate) return;
        }

        state.notifications.unshift({
          ...n,
          sticky: critical ? true : n.sticky,
          priority: critical ? "critical" : n.priority || "normal",
        });

        if (state.notifications.length > 10) {
          state.notifications.pop();
        }
      },

      prepare: ({ type = "info", message, duration = 3000, sticky = false }) => {
        const critical = isCritical(message);

        return {
          payload: {
            id: nanoid(),
            type,
            message,
            read: false,
            createdAt: Date.now(),
            duration: critical ? 0 : duration,
            sticky: critical || sticky,
            priority: critical ? "critical" : "normal",
          },
        };
      },
    },

    markAsRead: (state, action) => {
      const n = state.notifications.find((x) => x.id === action.payload);
      if (n) n.read = true;
    },

    markAllAsRead: (state) => {
      state.notifications.forEach((n) => (n.read = true));
    },

    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        (n) => n.id !== action.payload
      );
    },

    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/
export const {
  toggleSidebar,
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  clearNotifications,
} = uiSlice.actions;

export const selectNotifications = (state) => state.ui.notifications;

export const selectUnreadCount = (state) =>
  state.ui.notifications.filter((n) => !n.read).length;

export const selectSidebarState = (state) => state.ui.sidebarOpen;

export default uiSlice.reducer;