import {
  LayoutDashboard,
  Users,
  Shield,
  KeyRound,
  FileBarChart,
  Activity,

  Building2,
  Home,
  Layers,
  Grid3X3,
  Star,
  Eye,
  Heart,
  BarChart3,

  Building,
  Columns3,
  Square,

  UserCheck,
  FileText,
  CalendarDays,

  Calendar,
  ClipboardList,

  Wallet,
  Receipt,
  Banknote,
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,

  Wrench,
  ListChecks,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Cpu,
  Server,
  HardDrive,

  User,
  Key,
  LogOut,

  // OPTIONAL (for future feature assignment module)
  Link2,
} from "lucide-react";

const superAdminSidebar = [

  /* ---------------- DASHBOARD ---------------- */
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    children: [
      { title: "Overview", path: "/super-admin/dashboard" },
      { title: "Analytics", path: "/super-admin/dashboard/analytics", icon: BarChart3 },
      { title: "Reports", path: "/super-admin/dashboard/reports", icon: FileBarChart },
      { title: "Activity Logs", path: "/super-admin/activities", icon: Activity },
    ],
  },

  /* ---------------- USERS ---------------- */
  {
    title: "User Management",
    icon: Users,
    children: [
      { title: "Users", path: "/super-admin/users" },
      { title: "Roles", path: "/super-admin/roles", icon: Shield },
      { title: "Permissions", path: "/super-admin/permissions", icon: KeyRound },
      { title: "Role Requests", path: "/super-admin/role-requests", icon: FileText },
      { title: "User Activity", path: "/super-admin/activities", icon: Activity },
    ],
  },

  /* ---------------- PROPERTY ---------------- */
  {
    title: "Property Management",
    icon: Building2,
    children: [
      { title: "Properties", path: "/super-admin/properties" },
      { title: "Property Types", path: "/super-admin/property-types", icon: Home },
      { title: "Property Categories", path: "/super-admin/property-categories", icon: Grid3X3 },

      /* CORE MASTER DATA */
      { title: "Property Features", path: "/super-admin/property-features", icon: Layers },
      { title: "Property Amenities", path: "/super-admin/property-amenities", icon: Sparkles },

      /* 🔥 NEW (IMPORTANT FOR YOUR SYSTEM) */
      {
        title: "Feature Assignments",
        path: "/super-admin/property-feature-assignments",
        icon: Link2,
      },

      {
        title: "Amenity Assignments",
        path: "/super-admin/property-amenity-assignments",
        icon: Link2,
      },

      /* MEDIA & ANALYTICS */
      { title: "Property Reviews", path: "/super-admin/property-reviews", icon: Star },
      { title: "Property Visits", path: "/super-admin/property-visits", icon: Eye },
      { title: "Favorites", path: "/super-admin/favorites", icon: Heart },
      { title: "Property Analytics", path: "/super-admin/property-analytics", icon: BarChart3 },
    ],
  },

  /* ---------------- APARTMENTS ---------------- */
  {
    title: "Apartment Management",
    icon: Building,
    children: [
      { title: "Apartments", path: "/super-admin/apartments" },
      { title: "Floors", path: "/super-admin/floors", icon: Columns3 },
      { title: "Units", path: "/super-admin/units", icon: Square },
      { title: "Unit Occupancy", path: "/super-admin/units/occupancy", icon: UserCheck },
      { title: "Vacant Units", path: "/super-admin/units/vacant", icon: AlertTriangle },
    ],
  },

  /* ---------------- TENANTS ---------------- */
  {
    title: "Tenant Management",
    icon: UserCheck,
    children: [
      { title: "Tenants", path: "/super-admin/tenants" },
      { title: "Tenancies", path: "/super-admin/tenancies", icon: FileText },
      { title: "Leases", path: "/super-admin/leases", icon: CalendarDays },
      { title: "Lease Expiry", path: "/super-admin/leases/expiry", icon: Calendar },
      { title: "Tenant Reports", path: "/super-admin/tenants/reports", icon: FileBarChart },
    ],
  },

  /* ---------------- BOOKINGS ---------------- */
  {
    title: "Booking Management",
    icon: CalendarDays,
    children: [
      { title: "Bookings", path: "/super-admin/bookings" },
      { title: "Calendar", path: "/super-admin/bookings/calendar", icon: Calendar },
      { title: "Requests", path: "/super-admin/bookings/requests", icon: ClipboardList },
      { title: "Reports", path: "/super-admin/bookings/reports", icon: FileBarChart },
    ],
  },

  /* ---------------- FINANCE ---------------- */
  {
    title: "Financial Management",
    icon: Wallet,
    children: [
      { title: "Payments", path: "/super-admin/payments" },
      { title: "Invoices", path: "/super-admin/invoices", icon: Receipt },
      { title: "Expenses", path: "/super-admin/expenses", icon: Banknote },
      { title: "Utility Bills", path: "/super-admin/utilities", icon: DollarSign },
      { title: "Revenue Reports", path: "/super-admin/revenue", icon: TrendingUp },
      { title: "Expense Reports", path: "/super-admin/expense-reports", icon: TrendingDown },
      { title: "Payment Analytics", path: "/super-admin/payment-analytics", icon: PieChart },
      { title: "Financial Reports", path: "/super-admin/financial-reports", icon: FileBarChart },
    ],
  },

  /* ---------------- MAINTENANCE ---------------- */
  {
    title: "Maintenance",
    icon: Wrench,
    children: [
      { title: "Requests", path: "/super-admin/maintenance" },
      { title: "Categories", path: "/super-admin/maintenance/categories", icon: ListChecks },
      { title: "Ongoing", path: "/super-admin/maintenance/ongoing", icon: Activity },
      { title: "Completed", path: "/super-admin/maintenance/completed", icon: CheckCircle },
      { title: "Reports", path: "/super-admin/maintenance/reports", icon: FileBarChart },
    ],
  },

  /* ---------------- SYSTEM ---------------- */
  {
    title: "System Tools",
    icon: Server,
    children: [
      { title: "Logs", path: "/super-admin/system/logs" },
      { title: "Jobs", path: "/super-admin/system/jobs", icon: Activity },
      { title: "Cache", path: "/super-admin/system/cache", icon: Cpu },
      { title: "Backup", path: "/super-admin/system/backup", icon: HardDrive },
    ],
  },

  /* ---------------- PROFILE ---------------- */
  {
    title: "Profile",
    icon: User,
    children: [
      { title: "My Profile", path: "/super-admin/profile" },
      { title: "Change Password", path: "/super-admin/profile/password", icon: Key },
      {
        title: "Logout",
        icon: LogOut,
        action: "logout",
      },
    ],
  },
];

export default superAdminSidebar;