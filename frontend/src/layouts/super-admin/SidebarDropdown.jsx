import { useState } from "react";
import { ChevronDown } from "lucide-react";
import SidebarItem from "./SidebarItem";

const SidebarDropdown = ({
  item,
  collapsed,
}) => {

  const [open, setOpen] =
    useState(false);

  const Icon = item.icon;

  return (
    <div>

      <button
        onClick={() =>
          setOpen(!open)
        }
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-100 transition"
      >

        <div className="flex items-center gap-3">

          {Icon && (
            <Icon className="w-5 h-5 text-gray-700" />
          )}

          {!collapsed && (
            <span className="text-sm font-medium text-gray-700">
              {item.title}
            </span>
          )}

        </div>

        {!collapsed && (
          <ChevronDown
            className={`w-4 h-4 transition ${
              open
                ? "rotate-180"
                : ""
            }`}
          />
        )}

      </button>

      {open && !collapsed && (
        <div className="ml-4 mt-2 space-y-2">

          {item.children.map(
            (child, index) => (
              <SidebarItem
                key={index}
                item={child}
              />
            )
          )}

        </div>
      )}

    </div>
  );
};

export default SidebarDropdown;