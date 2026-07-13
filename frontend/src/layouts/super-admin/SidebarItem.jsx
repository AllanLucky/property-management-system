import { NavLink } from "react-router-dom";

const SidebarItem = ({
  item,
  collapsed = false,
}) => {

  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm font-medium ${
          isActive
            ? "bg-blue-600 text-white"
            : "text-gray-700 hover:bg-gray-100"
        }`
      }
    >

      {Icon && (
        <Icon className="w-5 h-5" />
      )}

      {!collapsed && (
        <span>{item.title}</span>
      )}

    </NavLink>
  );
};

export default SidebarItem;