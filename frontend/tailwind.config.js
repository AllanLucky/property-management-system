/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",

  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {

      // ================= PRIMARY BRAND =================
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },

        // ================= DARK UI SYSTEM =================
        dark: {
          bg: "#0f172a",        // main background
          card: "#1e293b",      // cards/sidebar
          soft: "#334155",      // borders
          text: "#e2e8f0",      // primary text
          muted: "#94a3b8",     // secondary text
        },

        // ================= STATUS COLORS =================
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
        info: "#3b82f6",
      },

      // ================= SHADOWS =================
      boxShadow: {
        soft: "0 2px 10px rgba(0,0,0,0.06)",
        card: "0 10px 25px rgba(0,0,0,0.08)",
        hover: "0 12px 30px rgba(0,0,0,0.12)",
      },

      // ================= ANIMATION =================
      animation: {
        fadeIn: "fadeIn 0.25s ease-in-out",
        slideIn: "slideIn 0.25s ease-in-out",
        smooth: "all 0.2s ease-in-out",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        slideIn: {
          "0%": { transform: "translateY(10px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
      },

      // ================= BORDER RADIUS =================
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },

      // ================= SPACING IMPROVEMENTS =================
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        26: "6.5rem",
      },
    },
  },

  plugins: [],
};