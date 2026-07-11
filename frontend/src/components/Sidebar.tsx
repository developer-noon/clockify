import { useState } from "react";
import { useNavigate } from "../hooks/useNavigate";
import { useAuth } from "../context/AuthContext";

export const Sidebar = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Timer", path: "/timer" },
    { label: "Time Entries", path: "/time-entries" },
    { label: "Clients", path: "/clients" },
    { label: "Projects", path: "/projects" },
    { label: "Reports", path: "/reports" },
  ];

  return (
    <div
      className={`bg-gray-900 text-white transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}
    >
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        {!collapsed && <h2 className="font-bold text-lg">TimeTrack</h2>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hover:bg-gray-800 p-2 rounded"
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      <nav className="p-4">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="w-full text-left px-4 py-2 rounded hover:bg-gray-800 mb-2 transition"
          >
            {!collapsed && item.label}
          </button>
        ))}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
        {!collapsed && (
          <div className="mb-4">
            <p className="text-xs text-gray-400">Logged in as</p>
            <p className="font-semibold truncate">{user?.name}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded transition"
        >
          {collapsed ? "X" : "Logout"}
        </button>
      </div>
    </div>
  );
};
